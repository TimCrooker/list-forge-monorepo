import { useRoutes } from 'react-router-dom';
import { router } from './router';
import AuthInitializer from './components/AuthInitializer';

function App() {
  const routes = useRoutes(router);
  return <AuthInitializer>{routes}</AuthInitializer>;
}

export default App;

