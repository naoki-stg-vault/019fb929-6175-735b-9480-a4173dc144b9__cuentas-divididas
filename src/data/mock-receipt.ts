import { Receipt } from '@/types/balance';

export const sampleReceipt: Receipt = {
  id: 'cena-viernes-101',
  title: 'Cena de Viernes en "La Cantina"',
  date: '18 de Septiembre, 2026',
  currency: '$',
  participants: [
    { id: 'p1', name: 'Ana Gómez', color: '#3B82F6', phone: '+5491112345678' },
    { id: 'p2', name: 'Carlos Díaz', color: '#10B981', phone: '+5491187654321' },
    { id: 'p3', name: 'Elena Ramos', color: '#F59E0B', phone: '+5491155556666' },
    { id: 'p4', name: 'Martín Vega', color: '#EC4899', phone: '+5491144443333' },
  ],
  items: [
    {
      id: 'i1',
      name: 'Entradas para compartir (Nachos & Quesadillas)',
      price: 24.0,
      quantity: 1,
      assignedTo: ['p1', 'p2', 'p3', 'p4'],
    },
    {
      id: 'i2',
      name: 'Tacos al Pastor Especiales',
      price: 18.5,
      quantity: 1,
      assignedTo: ['p1', 'p3'],
    },
    {
      id: 'i3',
      name: 'Bife de Chorizo a las brasas',
      price: 32.0,
      quantity: 1,
      assignedTo: ['p2'],
    },
    {
      id: 'i4',
      name: 'Hamburguesa Artesanal con Cheddar',
      price: 19.5,
      quantity: 1,
      assignedTo: ['p4'],
    },
    {
      id: 'i5',
      name: 'Cervezas Artesanales (pinta)',
      price: 6.0,
      quantity: 4,
      assignedTo: ['p1', 'p2', 'p3', 'p4'],
    },
    {
      id: 'i6',
      name: 'Postre Volcán de Chocolate',
      price: 12.0,
      quantity: 1,
      assignedTo: ['p1', 'p2', 'p4'],
    },
  ],
  tip: 15.0, // 15 propina voluntaria
  tax: 9.6, // impuestos / servicio de mesa
  discount: 5.0, // descuento promoción
  payers: [
    { participantId: 'p1', amount: 120.0 }, // Ana pagó la mayor parte con tarjeta
    { participantId: 'p2', amount: 29.6 }, // Carlos pagó el resto en efectivo
  ],
  settlementStatuses: {
    settle_p3_p1: 'PAID', // Elena ya le transfirió a Ana
  },
  notes: 'Comprobante #4829 - Mesa 12',
};
