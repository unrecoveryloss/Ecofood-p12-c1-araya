import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy,
} from "firebase/firestore";

// Crear una nueva solicitud
export const crearSolicitud = async (solicitudData) => {
    try {
        console.log("Creando solicitud:", solicitudData);
        const docRef = await addDoc(collection(db, "solicitudes"), solicitudData);
        console.log("Solicitud creada con ID:", docRef.id);
        return docRef;
    } catch (error) {
        console.error("Error al crear solicitud:", error);
        throw error;
    }
};

// Obtener solicitudes de un cliente
export const getSolicitudesCliente = async (clienteId) => {
    try {
        console.log("Obteniendo solicitudes para cliente:", clienteId);

        // Primero intentar con ordenamiento
        try {
            const q = query(
                collection(db, "solicitudes"),
                where("clienteId", "==", clienteId),
                orderBy("fechaSolicitud", "desc")
            );
            const snap = await getDocs(q);
            const solicitudes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            console.log("Solicitudes del cliente encontradas (con ordenamiento):", solicitudes.length);
            return solicitudes;
        } catch (indexError) {
            console.warn("Error de índice, intentando sin ordenamiento:", indexError);

            // Si falla, intentar sin ordenamiento
            const q = query(
                collection(db, "solicitudes"),
                where("clienteId", "==", clienteId)
            );
            const snap = await getDocs(q);
            const solicitudes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // Ordenar en el cliente
            solicitudes.sort((a, b) => {
                const fechaA = new Date(a.fechaSolicitud || 0);
                const fechaB = new Date(b.fechaSolicitud || 0);
                return fechaB - fechaA;
            });

            console.log("Solicitudes del cliente encontradas (sin ordenamiento):", solicitudes.length);
            return solicitudes;
        }
    } catch (error) {
        console.error("Error al obtener solicitudes del cliente:", error);
        throw error;
    }
};

// Obtener solicitudes de una empresa
export const getSolicitudesEmpresa = async (empresaId) => {
    try {
        console.log("Obteniendo solicitudes para empresa:", empresaId);

        // Primero intentar con ordenamiento
        try {
            const q = query(
                collection(db, "solicitudes"),
                where("empresaId", "==", empresaId),
                orderBy("fechaSolicitud", "desc")
            );
            const snap = await getDocs(q);
            const solicitudes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            console.log("Solicitudes de la empresa encontradas (con ordenamiento):", solicitudes.length);
            return solicitudes;
        } catch (indexError) {
            console.warn("Error de índice, intentando sin ordenamiento:", indexError);

            // Si falla, intentar sin ordenamiento
            const q = query(
                collection(db, "solicitudes"),
                where("empresaId", "==", empresaId)
            );
            const snap = await getDocs(q);
            const solicitudes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // Ordenar en el cliente
            solicitudes.sort((a, b) => {
                const fechaA = new Date(a.fechaSolicitud || 0);
                const fechaB = new Date(b.fechaSolicitud || 0);
                return fechaB - fechaA;
            });

            console.log("Solicitudes de la empresa encontradas (sin ordenamiento):", solicitudes.length);
            return solicitudes;
        }
    } catch (error) {
        console.error("Error al obtener solicitudes de la empresa:", error);
        throw error;
    }
};

// Aprobar una solicitud
export const aprobarSolicitud = async (solicitudId, fechaRespuesta) => {
    try {
        console.log("Aprobando solicitud:", solicitudId);
        const solicitudRef = doc(db, "solicitudes", solicitudId);
        await updateDoc(solicitudRef, {
            estado: "aprobada",
            fechaRespuesta: fechaRespuesta,
        });
        console.log("Solicitud aprobada exitosamente");
    } catch (error) {
        console.error("Error al aprobar solicitud:", error);
        throw error;
    }
};

// Rechazar una solicitud
export const rechazarSolicitud = async (solicitudId, fechaRespuesta) => {
    try {
        console.log("Rechazando solicitud:", solicitudId);
        const solicitudRef = doc(db, "solicitudes", solicitudId);
        await updateDoc(solicitudRef, {
            estado: "rechazada",
            fechaRespuesta: fechaRespuesta,
        });
        console.log("Solicitud rechazada exitosamente");
    } catch (error) {
        console.error("Error al rechazar solicitud:", error);
        throw error;
    }
};

// Obtener estadísticas de solicitudes
export const getEstadisticasSolicitudes = async (userId, tipo) => {
    try {
        console.log("Obteniendo estadísticas para:", tipo, userId);
        const campo = tipo === "cliente" ? "clienteId" : "empresaId";
        const q = query(
            collection(db, "solicitudes"),
            where(campo, "==", userId)
        );
        const snap = await getDocs(q);
        const solicitudes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const estadisticas = {
            total: solicitudes.length,
            pendientes: solicitudes.filter((s) => s.estado === "pendiente").length,
            aprobadas: solicitudes.filter((s) => s.estado === "aprobada").length,
            rechazadas: solicitudes.filter((s) => s.estado === "rechazada").length,
        };

        console.log("Estadísticas calculadas:", estadisticas);
        return estadisticas;
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        // Retornar estadísticas por defecto en caso de error
        return {
            total: 0,
            pendientes: 0,
            aprobadas: 0,
            rechazadas: 0,
        };
    }
}; 