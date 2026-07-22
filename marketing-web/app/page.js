import LandingPage from '../components/LandingPage';

export default function HomePage() {
  return <LandingPage year={new Date().getFullYear()}/>;
}
