"""Cisco Packet Tracer (.pkt / .pka) parser.

Supports two storage formats:
  • Plain ZIP + XML  — Packet Tracer <= 6.1 (open format)
  • Encrypted binary — Packet Tracer 6.2 – 9.x

The encrypted format uses:
  Stage-1 deobfuscation : reverse + positional XOR
  Twofish-EAX           : AEAD decrypt (fixed key/IV)
  Stage-2 deobfuscation : positional XOR
  Qt qCompress          : zlib with big-endian length prefix

All crypto is implemented here in pure Python — no third-party packages
needed.  The Twofish implementation is derived from Bjorn Edstrom's public
domain Python port of Dr Brian Gladman's reference code.
"""
from __future__ import annotations

import io
import struct
import sys
import zipfile
import xml.etree.ElementTree as ET
import zlib
from typing import Callable

from models.schemas import Device, Interface, Link, Topology

# ---------------------------------------------------------------------------
# Pure-Python Twofish (128-bit key, ECB encrypt/decrypt)
# Derived from Bjorn Edstrom's port of Dr Brian Gladman's reference code.
# ---------------------------------------------------------------------------

_WORD_BIGENDIAN = 1 if sys.byteorder == "big" else 0


def _rotr32(x: int, n: int) -> int:
    return (x >> n) | ((x << (32 - n)) & 0xFFFFFFFF)


def _rotl32(x: int, n: int) -> int:
    return ((x << n) & 0xFFFFFFFF) | (x >> (32 - n))


def _byteswap32(x: int) -> int:
    return (
        ((x & 0xFF) << 24)
        | (((x >> 8) & 0xFF) << 16)
        | (((x >> 16) & 0xFF) << 8)
        | ((x >> 24) & 0xFF)
    )


def _byte(x: int, n: int) -> int:
    return (x >> (8 * n)) & 0xFF


_TAB_5B = [0, 90, 180, 238]
_TAB_EF = [0, 238, 180, 90]
_ROR4 = [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]
_ASHX = [0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 5, 14, 7]
_QT0 = [
    [8, 1, 7, 13, 6, 15, 3, 2, 0, 11, 5, 9, 14, 12, 10, 4],
    [2, 8, 11, 13, 15, 7, 6, 14, 3, 1, 9, 4, 0, 10, 12, 5],
]
_QT1 = [
    [14, 12, 11, 8, 1, 2, 3, 5, 15, 4, 10, 6, 7, 0, 9, 13],
    [1, 14, 2, 11, 4, 12, 3, 7, 6, 13, 10, 5, 15, 9, 0, 8],
]
_QT2 = [
    [11, 10, 5, 14, 6, 13, 9, 0, 12, 8, 15, 3, 2, 4, 7, 1],
    [4, 12, 7, 5, 1, 6, 9, 10, 0, 14, 13, 8, 2, 11, 3, 15],
]
_QT3 = [
    [13, 7, 15, 4, 1, 2, 6, 14, 9, 11, 3, 0, 8, 5, 12, 10],
    [11, 9, 5, 1, 12, 3, 13, 14, 6, 4, 7, 15, 2, 0, 8, 10],
]


def _qp(n: int, x: int) -> int:
    n %= 0x100000000
    x %= 0x100
    a0 = x >> 4
    b0 = x & 15
    a1 = a0 ^ b0
    b1 = _ROR4[b0] ^ _ASHX[a0]
    a2 = _QT0[n][a1]
    b2 = _QT1[n][b1]
    a3 = a2 ^ b2
    b3 = _ROR4[b2] ^ _ASHX[a2]
    a4 = _QT2[n][a3]
    b4 = _QT3[n][b3]
    return (b4 << 4) | a4


class _TwofishCtx:
    def __init__(self) -> None:
        self.k_len = 0
        self.l_key = [0] * 40
        self.s_key = [0] * 4
        self.qt_gen = 0
        self.q_tab: list[list[int]] = [[0] * 256, [0] * 256]
        self.mt_gen = 0
        self.m_tab: list[list[int]] = [[0] * 256] * 4
        self.m_tab = [[0] * 256, [0] * 256, [0] * 256, [0] * 256]
        self.mk_tab: list[list[int]] = [[0] * 256, [0] * 256, [0] * 256, [0] * 256]


def _gen_qtab(ctx: _TwofishCtx) -> None:
    for i in range(256):
        ctx.q_tab[0][i] = _qp(0, i)
        ctx.q_tab[1][i] = _qp(1, i)


def _gen_mtab(ctx: _TwofishCtx) -> None:
    for i in range(256):
        f01 = ctx.q_tab[1][i]
        f5b = f01 ^ (f01 >> 2) ^ _TAB_5B[f01 & 3]
        fef = f01 ^ (f01 >> 1) ^ (f01 >> 2) ^ _TAB_EF[f01 & 3]
        ctx.m_tab[0][i] = f01 | (f5b << 8) | (fef << 16) | (fef << 24)
        ctx.m_tab[2][i] = f5b | (fef << 8) | (f01 << 16) | (fef << 24)
        f01 = ctx.q_tab[0][i]
        f5b = f01 ^ (f01 >> 2) ^ _TAB_5B[f01 & 3]
        fef = f01 ^ (f01 >> 1) ^ (f01 >> 2) ^ _TAB_EF[f01 & 3]
        ctx.m_tab[1][i] = fef | (fef << 8) | (f5b << 16) | (f01 << 24)
        ctx.m_tab[3][i] = f5b | (f01 << 8) | (fef << 16) | (f5b << 24)


def _gen_mk_tab(ctx: _TwofishCtx, key: list[int]) -> None:
    kl = ctx.k_len
    for i in range(256):
        by = i & 0xFF
        if kl == 2:
            ctx.mk_tab[0][i] = ctx.m_tab[0][ctx.q_tab[0][ctx.q_tab[0][by] ^ _byte(key[1], 0)] ^ _byte(key[0], 0)]
            ctx.mk_tab[1][i] = ctx.m_tab[1][ctx.q_tab[0][ctx.q_tab[1][by] ^ _byte(key[1], 1)] ^ _byte(key[0], 1)]
            ctx.mk_tab[2][i] = ctx.m_tab[2][ctx.q_tab[1][ctx.q_tab[0][by] ^ _byte(key[1], 2)] ^ _byte(key[0], 2)]
            ctx.mk_tab[3][i] = ctx.m_tab[3][ctx.q_tab[1][ctx.q_tab[1][by] ^ _byte(key[1], 3)] ^ _byte(key[0], 3)]
        elif kl == 3:
            ctx.mk_tab[0][i] = ctx.m_tab[0][ctx.q_tab[0][ctx.q_tab[0][ctx.q_tab[1][by] ^ _byte(key[2], 0)] ^ _byte(key[1], 0)] ^ _byte(key[0], 0)]
            ctx.mk_tab[1][i] = ctx.m_tab[1][ctx.q_tab[0][ctx.q_tab[1][ctx.q_tab[1][by] ^ _byte(key[2], 1)] ^ _byte(key[1], 1)] ^ _byte(key[0], 1)]
            ctx.mk_tab[2][i] = ctx.m_tab[2][ctx.q_tab[1][ctx.q_tab[0][ctx.q_tab[0][by] ^ _byte(key[2], 2)] ^ _byte(key[1], 2)] ^ _byte(key[0], 2)]
            ctx.mk_tab[3][i] = ctx.m_tab[3][ctx.q_tab[1][ctx.q_tab[1][ctx.q_tab[0][by] ^ _byte(key[2], 3)] ^ _byte(key[1], 3)] ^ _byte(key[0], 3)]
        else:  # kl == 4
            ctx.mk_tab[0][i] = ctx.m_tab[0][ctx.q_tab[0][ctx.q_tab[0][ctx.q_tab[1][ctx.q_tab[1][by] ^ _byte(key[3], 0)] ^ _byte(key[2], 0)] ^ _byte(key[1], 0)] ^ _byte(key[0], 0)]
            ctx.mk_tab[1][i] = ctx.m_tab[1][ctx.q_tab[0][ctx.q_tab[1][ctx.q_tab[1][ctx.q_tab[0][by] ^ _byte(key[3], 1)] ^ _byte(key[2], 1)] ^ _byte(key[1], 1)] ^ _byte(key[0], 1)]
            ctx.mk_tab[2][i] = ctx.m_tab[2][ctx.q_tab[1][ctx.q_tab[0][ctx.q_tab[0][ctx.q_tab[0][by] ^ _byte(key[3], 2)] ^ _byte(key[2], 2)] ^ _byte(key[1], 2)] ^ _byte(key[0], 2)]
            ctx.mk_tab[3][i] = ctx.m_tab[3][ctx.q_tab[1][ctx.q_tab[1][ctx.q_tab[0][ctx.q_tab[1][by] ^ _byte(key[3], 3)] ^ _byte(key[2], 3)] ^ _byte(key[1], 3)] ^ _byte(key[0], 3)]


def _h_fun(ctx: _TwofishCtx, x: int, key: list[int]) -> int:
    b0, b1, b2, b3 = _byte(x, 0), _byte(x, 1), _byte(x, 2), _byte(x, 3)
    if ctx.k_len >= 4:
        b0 = ctx.q_tab[1][b0] ^ _byte(key[3], 0)
        b1 = ctx.q_tab[0][b1] ^ _byte(key[3], 1)
        b2 = ctx.q_tab[0][b2] ^ _byte(key[3], 2)
        b3 = ctx.q_tab[1][b3] ^ _byte(key[3], 3)
    if ctx.k_len >= 3:
        b0 = ctx.q_tab[1][b0] ^ _byte(key[2], 0)
        b1 = ctx.q_tab[1][b1] ^ _byte(key[2], 1)
        b2 = ctx.q_tab[0][b2] ^ _byte(key[2], 2)
        b3 = ctx.q_tab[0][b3] ^ _byte(key[2], 3)
    b0 = ctx.q_tab[0][ctx.q_tab[0][b0] ^ _byte(key[1], 0)] ^ _byte(key[0], 0)
    b1 = ctx.q_tab[0][ctx.q_tab[1][b1] ^ _byte(key[1], 1)] ^ _byte(key[0], 1)
    b2 = ctx.q_tab[1][ctx.q_tab[0][b2] ^ _byte(key[1], 2)] ^ _byte(key[0], 2)
    b3 = ctx.q_tab[1][ctx.q_tab[1][b3] ^ _byte(key[1], 3)] ^ _byte(key[0], 3)
    return ctx.m_tab[0][b0] ^ ctx.m_tab[1][b1] ^ ctx.m_tab[2][b2] ^ ctx.m_tab[3][b3]


def _mds_rem(p0: int, p1: int) -> int:
    for _ in range(8):
        t = p1 >> 24
        p1 = ((p1 << 8) & 0xFFFFFFFF) | (p0 >> 24)
        p0 = (p0 << 8) & 0xFFFFFFFF
        u = (t << 1) & 0xFFFFFFFF
        if t & 0x80:
            u ^= 0x0000014D
        p1 ^= t ^ ((u << 16) & 0xFFFFFFFF)
        u ^= t >> 1
        if t & 0x01:
            u ^= 0x0000014D >> 1
        p1 ^= ((u << 24) & 0xFFFFFFFF) | ((u << 8) & 0xFFFFFFFF)
    return p1


def _tf_set_key(ctx: _TwofishCtx, in_key: list[int], key_len: int) -> None:
    if not ctx.qt_gen:
        _gen_qtab(ctx)
        ctx.qt_gen = 1
    if not ctx.mt_gen:
        _gen_mtab(ctx)
        ctx.mt_gen = 1
    ctx.k_len = (key_len * 8) // 64
    me_key = [0, 0, 0, 0]
    mo_key = [0, 0, 0, 0]
    for i in range(ctx.k_len):
        a = in_key[i * 2]
        me_key[i] = a
        b = in_key[i * 2 + 1]
        mo_key[i] = b
        ctx.s_key[ctx.k_len - i - 1] = _mds_rem(a, b)
    for i in range(0, 40, 2):
        a = (0x01010101 * i) % 0x100000000
        b = (a + 0x01010101) % 0x100000000
        a = _h_fun(ctx, a, me_key)
        b = _rotl32(_h_fun(ctx, b, mo_key), 8)
        ctx.l_key[i] = (a + b) % 0x100000000
        ctx.l_key[i + 1] = _rotl32((a + 2 * b) % 0x100000000, 9)
    _gen_mk_tab(ctx, ctx.s_key)


def _tf_encrypt_block(ctx: _TwofishCtx, blk: list[int]) -> None:
    if _WORD_BIGENDIAN:
        b = [_byteswap32(blk[j]) ^ ctx.l_key[j] for j in range(4)]
    else:
        b = [blk[j] ^ ctx.l_key[j] for j in range(4)]
    for i in range(8):
        t1 = ctx.mk_tab[0][_byte(b[1], 3)] ^ ctx.mk_tab[1][_byte(b[1], 0)] ^ ctx.mk_tab[2][_byte(b[1], 1)] ^ ctx.mk_tab[3][_byte(b[1], 2)]
        t0 = ctx.mk_tab[0][_byte(b[0], 0)] ^ ctx.mk_tab[1][_byte(b[0], 1)] ^ ctx.mk_tab[2][_byte(b[0], 2)] ^ ctx.mk_tab[3][_byte(b[0], 3)]
        b[2] = _rotr32(b[2] ^ ((t0 + t1 + ctx.l_key[4 * i + 8]) % 0x100000000), 1)
        b[3] = _rotl32(b[3], 1) ^ ((t0 + 2 * t1 + ctx.l_key[4 * i + 9]) % 0x100000000)
        t1 = ctx.mk_tab[0][_byte(b[3], 3)] ^ ctx.mk_tab[1][_byte(b[3], 0)] ^ ctx.mk_tab[2][_byte(b[3], 1)] ^ ctx.mk_tab[3][_byte(b[3], 2)]
        t0 = ctx.mk_tab[0][_byte(b[2], 0)] ^ ctx.mk_tab[1][_byte(b[2], 1)] ^ ctx.mk_tab[2][_byte(b[2], 2)] ^ ctx.mk_tab[3][_byte(b[2], 3)]
        b[0] = _rotr32(b[0] ^ ((t0 + t1 + ctx.l_key[4 * i + 10]) % 0x100000000), 1)
        b[1] = _rotl32(b[1], 1) ^ ((t0 + 2 * t1 + ctx.l_key[4 * i + 11]) % 0x100000000)
    if _WORD_BIGENDIAN:
        blk[0] = _byteswap32(b[2] ^ ctx.l_key[4])
        blk[1] = _byteswap32(b[3] ^ ctx.l_key[5])
        blk[2] = _byteswap32(b[0] ^ ctx.l_key[6])
        blk[3] = _byteswap32(b[1] ^ ctx.l_key[7])
    else:
        blk[0] = b[2] ^ ctx.l_key[4]
        blk[1] = b[3] ^ ctx.l_key[5]
        blk[2] = b[0] ^ ctx.l_key[6]
        blk[3] = b[1] ^ ctx.l_key[7]


class _Twofish:
    """128-bit-key Twofish, ECB mode, operates on 16-byte blocks."""

    def __init__(self, key: bytes) -> None:
        if len(key) not in (16, 24, 32):
            raise ValueError("Twofish key must be 16, 24, or 32 bytes")
        self._ctx = _TwofishCtx()
        kw = list(struct.unpack(f"<{len(key) // 4}I", key))
        _tf_set_key(self._ctx, kw, len(key))

    def encrypt_block(self, block: bytes) -> bytes:
        if len(block) != 16:
            raise ValueError("block must be 16 bytes")
        blk = list(struct.unpack("<4I", block))
        _tf_encrypt_block(self._ctx, blk)
        return struct.pack("<4I", *blk)


# ---------------------------------------------------------------------------
# CMAC (OMAC)
# ---------------------------------------------------------------------------

_BS = 16  # block size


def _xor_bytes(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))


def _lshift1(bs: bytes) -> bytes:
    out = bytearray(len(bs))
    carry = 0
    for i in reversed(range(len(bs))):
        nw = (bs[i] << 1) & 0xFF
        out[i] = nw | carry
        carry = (bs[i] & 0x80) >> 7
    return bytes(out)


def _cmac_subkeys(enc: Callable[[bytes], bytes]):
    rb = 0x87
    L = enc(b"\x00" * _BS)
    K1 = _lshift1(L)
    if L[0] & 0x80:
        K1 = _xor_bytes(K1, b"\x00" * 15 + bytes([rb]))
    K2 = _lshift1(K1)
    if K1[0] & 0x80:
        K2 = _xor_bytes(K2, b"\x00" * 15 + bytes([rb]))
    return K1, K2


def _cmac(enc: Callable[[bytes], bytes], K1: bytes, K2: bytes, data: bytes) -> bytes:
    if not data:
        last = _xor_bytes(b"\x80" + b"\x00" * 15, K2)
        blocks: list[bytes] = []
    else:
        raw = [data[i : i + _BS] for i in range(0, len(data), _BS)]
        if len(raw[-1]) == _BS:
            last = _xor_bytes(raw[-1], K1)
            blocks = raw[:-1]
        else:
            pad = raw[-1] + b"\x80" + b"\x00" * (_BS - len(raw[-1]) - 1)
            last = _xor_bytes(pad, K2)
            blocks = raw[:-1]
    X = b"\x00" * _BS
    for blk in blocks:
        X = enc(_xor_bytes(X, blk))
    return enc(_xor_bytes(X, last))


# ---------------------------------------------------------------------------
# CTR mode (big-endian counter)
# ---------------------------------------------------------------------------


def _ctr_process(enc: Callable[[bytes], bytes], counter: bytes, data: bytes) -> bytes:
    ctr = bytearray(counter)
    out = bytearray()
    off = 0
    while off < len(data):
        ks = enc(bytes(ctr))
        # increment counter big-endian
        for j in range(_BS - 1, -1, -1):
            ctr[j] = (ctr[j] + 1) & 0xFF
            if ctr[j] != 0:
                break
        chunk = data[off : off + _BS]
        out.extend(b ^ k for b, k in zip(chunk, ks))
        off += _BS
    return bytes(out)


# ---------------------------------------------------------------------------
# EAX authenticated encryption
# ---------------------------------------------------------------------------


def _eax_decrypt(enc: Callable[[bytes], bytes], K1: bytes, K2: bytes, nonce: bytes, ciphertext: bytes, tag: bytes) -> bytes:
    def omac(prefix: int, payload: bytes) -> bytes:
        return _cmac(enc, K1, K2, b"\x00" * (_BS - 1) + bytes([prefix]) + payload)

    n_tag = omac(0, nonce)
    plaintext = _ctr_process(enc, n_tag, ciphertext)
    h_tag = omac(1, b"")
    c_tag = omac(2, ciphertext)
    expected = _xor_bytes(_xor_bytes(n_tag, h_tag), c_tag)
    if expected != tag:
        raise ValueError("EAX tag mismatch — wrong key or corrupted file")
    return plaintext


def _eax_encrypt(enc: Callable[[bytes], bytes], K1: bytes, K2: bytes, nonce: bytes, plaintext: bytes) -> tuple[bytes, bytes]:
    def omac(prefix: int, payload: bytes) -> bytes:
        return _cmac(enc, K1, K2, b"\x00" * (_BS - 1) + bytes([prefix]) + payload)

    n_tag = omac(0, nonce)
    ciphertext = _ctr_process(enc, n_tag, plaintext)
    h_tag = omac(1, b"")
    c_tag = omac(2, ciphertext)
    tag = _xor_bytes(_xor_bytes(n_tag, h_tag), c_tag)
    return ciphertext, tag


# ---------------------------------------------------------------------------
# Packet Tracer decryption pipeline
# ---------------------------------------------------------------------------

_PT_KEY = bytes([137]) * 16
_PT_IV = bytes([16]) * 16


def _deobf_stage1(data: bytes) -> bytes:
    L = len(data)
    return bytes(data[L - 1 - i] ^ ((L - i * L) & 0xFF) for i in range(L))


def _deobf_stage2(data: bytes) -> bytes:
    L = len(data)
    return bytes(b ^ ((L - i) & 0xFF) for i, b in enumerate(data))


def _qt_decompress(blob: bytes) -> bytes:
    """Qt qCompress: 4-byte big-endian uncompressed size + zlib stream."""
    size = struct.unpack(">I", blob[:4])[0]
    return zlib.decompress(blob[4:])[:size]


def _decrypt_pkt(raw: bytes) -> bytes:
    """Full pipeline: stage1 → Twofish-EAX decrypt → stage2 → qDecompress."""
    stage1 = _deobf_stage1(raw)
    ciphertext = stage1[:-16]
    tag = stage1[-16:]
    tf = _Twofish(_PT_KEY)
    K1, K2 = _cmac_subkeys(tf.encrypt_block)
    decrypted = _eax_decrypt(tf.encrypt_block, K1, K2, _PT_IV, ciphertext, tag)
    stage2 = _deobf_stage2(decrypted)
    return _qt_decompress(stage2)


def _obf_stage2(data: bytes) -> bytes:
    """Inverse of _deobf_stage2 — same XOR mask, so it's its own inverse."""
    return _deobf_stage2(data)


def _qt_compress(data: bytes) -> bytes:
    """Qt qCompress: 4-byte big-endian original size + zlib compressed data."""
    compressed = zlib.compress(data)
    return struct.pack(">I", len(data)) + compressed


def _obf_stage1(data: bytes) -> bytes:
    """Inverse of _deobf_stage1: XOR each byte then reverse the buffer."""
    L = len(data)
    xored = bytes(data[i] ^ ((L - (L - 1 - i) * L) & 0xFF) for i in range(L))
    return xored[::-1]


def _encrypt_pkt(xml_bytes: bytes) -> bytes:
    """Full pipeline (reverse): qCompress → stage2 → Twofish-EAX → stage1."""
    compressed = _qt_compress(xml_bytes)
    stage2 = _obf_stage2(compressed)
    tf = _Twofish(_PT_KEY)
    K1, K2 = _cmac_subkeys(tf.encrypt_block)
    ciphertext, tag = _eax_encrypt(tf.encrypt_block, K1, K2, _PT_IV, stage2)
    combined = ciphertext + tag
    return _obf_stage1(combined)

_TYPE_MAP = {
    "router": "Router",
    "switch": "Switch",
    "multilayer switch": "Switch",
    "access point": "AP",
    "pc": "PC",
    "laptop": "PC",
    "server": "Server",
    "firewall": "Firewall",
    "generic": "Server",
}


class ParseError(Exception):
    """Raised when a .pkt file cannot be understood."""


def _map_type(raw: str) -> str:
    key = (raw or "").strip().lower()
    for needle, mapped in _TYPE_MAP.items():
        if needle in key:
            return mapped
    return "Server"


def _get_xml_bytes(data: bytes) -> bytes:
    """Return the raw XML bytes from a .pkt file.

    Tries in order:
      1. Plain ZIP containing an XML file  (PT <= 6.1)
      2. Twofish-EAX encrypted binary      (PT 6.2 – 9.x)
    Raises ParseError with a human-readable message on total failure.
    """
    # --- attempt 1: plain ZIP ---
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
        names = zf.namelist()
        xml_names = [n for n in names if n.lower().endswith(".xml")]
        if xml_names:
            return zf.read(xml_names[0])
        # nested ZIP / largest file fallback
        zip_names = [n for n in names if n.lower().endswith((".zip", ".pkt", ".pka"))]
        if zip_names:
            inner = zf.read(zip_names[0])
            try:
                return _get_xml_bytes(inner)
            except ParseError:
                pass
        if names:
            largest = max(names, key=lambda n: zf.getinfo(n).file_size)
            candidate = zf.read(largest)
            if candidate.lstrip().startswith(b"<"):
                return candidate
    except zipfile.BadZipFile:
        pass

    # --- attempt 2: Twofish-EAX encrypted (PT 6.2 – 9.x) ---
    try:
        return _decrypt_pkt(data)
    except Exception as exc:  # noqa: BLE001
        raise ParseError(
            f"Unable to parse this Packet Tracer file. "
            f"It may be corrupted or from an unsupported version. "
            f"(Decryption error: {exc})"
        ) from exc


def _find_first(elem: ET.Element, *tag_candidates: str) -> ET.Element | None:
    for tag in tag_candidates:
        found = elem.find(f".//{tag}")
        if found is not None:
            return found
    return None


def _text_of(elem: ET.Element | None, default: str = "") -> str:
    if elem is None or elem.text is None:
        return default
    return elem.text.strip()


def _extract_config(device_elem: ET.Element) -> str:
    # Real PT 6.2-9.x exports store the running-config as one <LINE> element
    # per config line under ENGINE/.../RUNNINGCONFIG, not as a single text blob.
    running = _find_first(device_elem, "RUNNINGCONFIG", "STARTUPCONFIG")
    if running is not None:
        line_elems = running.findall("LINE")
        if line_elems:
            return "\n".join((le.text or "") for le in line_elems).strip("\n")

    engine = _find_first(device_elem, "ENGINE", "RUNNINGCONFIG", "STARTUPCONFIG")
    if engine is None:
        return ""
    # Older/other schemas nest the raw config under a CONFIG/RUNNING child, others
    # put it directly as element text.
    config_child = _find_first(engine, "CONFIG", "RUNNING", "STARTUP")
    if config_child is not None and config_child.text:
        return config_child.text.strip("\n")
    if engine.text:
        return engine.text.strip("\n")
    return ""


def _interfaces_from_config(config: str) -> list[Interface]:
    """Real PT exports don't label their <PORT> blocks with interface names,
    but every device's running-config lists 'interface X' blocks explicitly —
    that's a far more reliable source of interface names than the port tree."""
    interfaces: list[Interface] = []
    current_name: str | None = None
    current_lines: list[str] = []

    def flush() -> None:
        if current_name is None:
            return
        status = "down" if any("shutdown" in l for l in current_lines) else "up"
        interfaces.append(Interface(name=current_name, status=status, config_lines=list(current_lines)))

    for raw in config.splitlines():
        stripped = raw.strip()
        if stripped.startswith("interface "):
            flush()
            current_name = stripped[len("interface "):].strip()
            current_lines = []
        elif current_name is not None:
            if stripped == "!":
                flush()
                current_name = None
                current_lines = []
            elif stripped:
                current_lines.append(stripped)
    flush()
    return interfaces


def _config_lines_for_interface(config: str, iface_name: str) -> list[str]:
    lines = config.splitlines()
    out: list[str] = []
    in_block = False
    short = iface_name.replace("GigabitEthernet", "Gi").replace("FastEthernet", "Fa").replace("TenGigabitEthernet", "Te")
    for raw in lines:
        stripped = raw.strip()
        if stripped.startswith("interface ") and (iface_name in stripped or short in stripped):
            in_block = True
            continue
        if in_block:
            if stripped == "!" or (not raw.startswith((" ", "\t")) and stripped):
                in_block = False
                continue
            if stripped:
                out.append(stripped)
    return out


def _extract_devices(root: ET.Element) -> dict[str, Device]:
    devices: dict[str, Device] = {}
    device_elems = root.findall(".//DEVICE") or root.findall(".//NETWORK/DEVICES/DEVICE") or root.findall(".//DEVICES/DEVICE")

    for idx, dev_elem in enumerate(device_elems):
        # Real PT 6.2-9.x exports key devices by a <SAVE_REF_ID>save-ref-id:NNN</SAVE_REF_ID>
        # element (referenced verbatim by <FROM>/<TO> in links) rather than an "id" attribute.
        save_ref_elem = _find_first(dev_elem, "SAVE_REF_ID")
        dev_id = (
            _text_of(save_ref_elem)
            or dev_elem.get("id")
            or dev_elem.get("ID")
            or dev_elem.get("saveRef")
            or f"pkt-device-{idx}"
        )

        name_elem = _find_first(dev_elem, "SAVE_REF_NAME", "NAME", "PROPERTY/NAME")
        name = _text_of(name_elem) or dev_elem.get("name", f"Device-{idx}")

        type_elem = _find_first(dev_elem, "TYPE", "MODEL", "PROPERTY/TYPE")
        raw_type = _text_of(type_elem) or dev_elem.get("type", "")
        device_type = _map_type(raw_type)

        # Real exports carry the model as an attribute on <TYPE model="2911">Router</TYPE>;
        # older/synthetic schemas use a separate <MODEL> element.
        model = (type_elem.get("model") or type_elem.get("customModel") or "") if type_elem is not None else ""
        if not model:
            model_elem = _find_first(dev_elem, "MODEL", "PROPERTY/MODEL")
            model = _text_of(model_elem)

        # Real exports place canvas coordinates as <WORKSPACE><LOGICAL><X>/<Y></LOGICAL>
        # child elements; older/synthetic schemas use x/y attributes on a POSITION element.
        x = y = 0.0
        logical_elem = _find_first(dev_elem, "WORKSPACE/LOGICAL")
        if logical_elem is not None and logical_elem.find("X") is not None:
            x = float(_text_of(logical_elem.find("X"), "0") or 0)
            y = float(_text_of(logical_elem.find("Y"), "0") or 0)
        else:
            pos_elem = _find_first(dev_elem, "POSITION", "VISUAL/POSITION")
            if pos_elem is not None:
                x = float(pos_elem.get("x", 0))
                y = float(pos_elem.get("y", 0))

        config = _extract_config(dev_elem)

        # Real exports don't label <PORT> blocks with interface names — derive them
        # from the running-config's "interface X" headers instead (far more reliable).
        interfaces = _interfaces_from_config(config) if config else []
        if not interfaces:
            iface_elems = dev_elem.findall(".//PORT") or dev_elem.findall(".//INTERFACE")
            for pe in iface_elems:
                iname = pe.get("name") or _text_of(_find_first(pe, "NAME"))
                if not iname:
                    continue
                interfaces.append(
                    Interface(
                        name=iname,
                        status="up" if pe.get("status", "up") != "down" else "down",
                        config_lines=_config_lines_for_interface(config, iname) if config else [],
                    )
                )

        devices[dev_id] = Device(
            id=dev_id,
            name=name,
            type=device_type,
            model=model,
            position={"x": x, "y": y},
            config=config,
            interfaces=interfaces,
        )
    return devices


def _link_from_cable_sequence(cable: ET.Element) -> Link | None:
    """Real PT exports encode each cable as a flat, ordered child sequence
    inside <CABLE>: ...<FROM>save-ref-id:X</FROM><PORT>Gi0/1</PORT><TO>save-ref-id:Y</TO><PORT>Gi0/2</PORT>...
    The two <PORT> elements carry only interface names, as text — the device
    each belongs to is determined purely by which of FROM/TO preceded it."""
    from_ref = to_ref = None
    from_iface = to_iface = None
    pending: str | None = None
    for child in cable:
        if child.tag == "FROM":
            from_ref = (child.text or "").strip()
            pending = "from"
        elif child.tag == "TO":
            to_ref = (child.text or "").strip()
            pending = "to"
        elif child.tag == "PORT":
            iface = (child.text or "").strip()
            if pending == "from" and from_iface is None:
                from_iface = iface
            elif pending == "to" and to_iface is None:
                to_iface = iface
    if from_ref and to_ref and from_iface and to_iface:
        return Link(source_device=from_ref, source_interface=from_iface, target_device=to_ref, target_interface=to_iface)
    return None


def _extract_links(root: ET.Element) -> list[Link]:
    links: list[Link] = []
    link_elems = root.findall(".//LINKS/LINK") or root.findall(".//CONNECTION") or root.findall(".//WIRE")

    for le in link_elems:
        cable = _find_first(le, "CABLE") or le

        link = _link_from_cable_sequence(cable)
        if link is not None:
            links.append(link)
            continue

        # Older/synthetic schema: two <PORT device="..." name="..."/> siblings under CABLE.
        ends = le.findall(".//CABLE/PORT") or le.findall(".//PORT") or le.findall(".//ENDPOINT")
        if len(ends) < 2:
            continue
        src, dst = ends[0], ends[1]
        src_device = src.get("device") or src.get("deviceId") or src.get("deviceRef")
        dst_device = dst.get("device") or dst.get("deviceId") or dst.get("deviceRef")
        src_iface = src.get("name") or _text_of(_find_first(src, "NAME"))
        dst_iface = dst.get("name") or _text_of(_find_first(dst, "NAME"))
        if not (src_device and dst_device and src_iface and dst_iface):
            continue
        links.append(Link(source_device=src_device, source_interface=src_iface, target_device=dst_device, target_interface=dst_iface))
    return links


def parse(file_bytes: bytes) -> Topology:
    xml_bytes = _get_xml_bytes(file_bytes)

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as exc:
        raise ParseError(
            "Unable to parse this Packet Tracer file. The XML content is malformed."
        ) from exc

    devices_by_id = _extract_devices(root)
    if not devices_by_id:
        raise ParseError("No devices found in this Packet Tracer file. It may be empty or use an unsupported schema.")

    links = _extract_links(root)

    warnings: list[str] = []
    if not links:
        warnings.append("No cable connections were found in this file — the topology will render as isolated devices.")

    return Topology(devices=list(devices_by_id.values()), links=links, warnings=warnings)
