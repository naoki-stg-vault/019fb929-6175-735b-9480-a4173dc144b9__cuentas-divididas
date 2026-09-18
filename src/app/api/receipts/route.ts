import { NextResponse } from 'next/server';
import { getAllReceipts, createReceipt } from '@/lib/storage';
import { CreateReceiptDTO } from '@/types/receipt';

export async function GET() {
  try {
    const receipts = await getAllReceipts();
    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Error al obtener los comprobantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Formato JSON inválido' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud no es un objeto válido' },
        { status: 400 }
      );
    }

    const payload = body as Partial<CreateReceiptDTO>;

    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título del comprobante es requerido' },
        { status: 400 }
      );
    }

    if (payload.items !== undefined && !Array.isArray(payload.items)) {
      return NextResponse.json(
        { error: 'La lista de ítems debe ser un arreglo' },
        { status: 400 }
      );
    }

    if (payload.participants !== undefined && !Array.isArray(payload.participants)) {
      return NextResponse.json(
        { error: 'La lista de participantes debe ser un arreglo' },
        { status: 400 }
      );
    }

    if (payload.items) {
      for (let i = 0; i < payload.items.length; i++) {
        const item = payload.items[i];
        if (!item || typeof item !== 'object' || typeof item.description !== 'string' || typeof item.totalPrice !== 'number') {
          return NextResponse.json(
            { error: `Ítem inválido en el índice ${i}: requiere 'description' y 'totalPrice' numérico` },
            { status: 400 }
          );
        }
      }
    }

    if (payload.participants) {
      for (let i = 0; i < payload.participants.length; i++) {
        const participant = payload.participants[i];
        if (!participant || typeof participant !== 'object' || typeof participant.name !== 'string' || participant.name.trim().length === 0) {
          return NextResponse.json(
            { error: `Participante inválido en el índice ${i}: requiere 'name' no vacío` },
            { status: 400 }
          );
        }
      }
    }

    const created = await createReceipt(payload as CreateReceiptDTO);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: 'Error al crear el comprobante' },
      { status: 500 }
    );
  }
}
