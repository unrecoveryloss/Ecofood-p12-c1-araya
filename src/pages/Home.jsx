import CardProducto from "../components/CardProducto";
function Home() {
  return (
    <div className="container mt-4">
      <h1>Productos Disponibles</h1>
      <CardProducto nombre="Pan Integral" precio="$500" />
    </div>
  );
}
export default Home;

import CerrarSesion from "../components/CerrarSesion";
function Home() {
  return (
    <div>
      <h2>Bienvenido a EcoFood</h2>
      <CerrarSesion />
    </div>
  );
}

import { getUserData } from "../services/userService";
import { useAuth } from "../context/AuthContext";
useEffect(() => {
  const fetch = async () => {
    const datos = await getUserData(user.uid);
    setUserData(datos);
  };
  if (user) fetch();
}, [user]);
