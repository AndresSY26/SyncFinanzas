import { EventEmitter } from 'events';

// Instancia global del emisor de eventos.
// Nos sirve como un bus interno para comunicar la capa de servicios 
// (lógica de negocio) con la capa de WebSockets sin acoplar código.
export const appEvents = new EventEmitter();
