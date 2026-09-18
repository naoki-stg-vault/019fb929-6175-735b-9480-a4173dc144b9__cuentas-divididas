import { NextResponse } from 'next/server';
import { getReceiptById, updateReceipt, deleteReceipt, isValidId } from '@/lib/storage';
import { UpdateReceiptDTO } from '@/types/receipt';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID de comprobante inválido' },
        { status: 400 }
      );
    }

    const receipt = await getReceiptById(id);
    if (!receipt) {
      return NextResponse.json(
        { error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt by id:', error);
    return NextResponse.json(
      { error: 'Error al obtener el comprobante' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID de comprobante inválido' },
        { status: 400 }
      );
    }

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

    const payload = body as Partial<UpdateReceiptDTO>;

    if (payload.title !== undefined) {
      if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'El título no puede estar vacío' },
          { status: 400 }
        );
      }
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

    const updated = await updateReceipt(id, payload as UpdateReceiptDTO);
    if (!updated) {
      return NextResponse.json(
        { error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el comprobante' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID de comprobante inválido' },
        { status: 400 }
      );
    }

    const deleted = await deleteReceipt(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el comprobante' },
      { status: 500 }
    );
  }
}
