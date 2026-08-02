import logo from '../../assets/logo.png';

export function Logomark({ size = 28 }: { size?: number }) {
  return <img src={logo} alt="PathVector" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />;
}
