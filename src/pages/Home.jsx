import CerrarSesion from "../components/CerrarSesion";
import CardProducto from "../components/CardProducto";

function Home() {
  return (
    <div className="container mt-4">
      <CerrarSesion />
      <h1>Productos Disponibles</h1>
      <CardProducto nombre="Pan Integral" precio="$500" />
      <CardProducto nombre="Pan Integral" precio="$500" />
    </div>
  );
}

export default Home;