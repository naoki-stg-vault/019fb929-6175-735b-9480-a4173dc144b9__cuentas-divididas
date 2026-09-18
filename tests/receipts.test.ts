import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Setup isolated test directory
const testDataDir = path.join(os.tmpdir(), `receipts-test-${Date.now()}`);
process.env.RECEIPTS_DATA_DIR = testDataDir;

import {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  isValidId,
  writeAtomicJson,
} from '../src/lib/storage';
import { calculateSplit } from '../src/lib/split';
import { GET as getReceiptsRoute, POST as postReceiptRoute } from '../src/app/api/receipts/route';
import {
  GET as getReceiptByIdRoute,
  PUT as putReceiptByIdRoute,
  DELETE as deleteReceiptByIdRoute,
} from '../src/app/api/receipts/[id]/route';

async function runTests() {
  console.log('Running tests in isolated directory:', testDataDir);

  try {
    // ----------------------------------------------------
    // 1. Validation helpers
    // ----------------------------------------------------
    console.log('Testing isValidId...');
    assert.strictEqual(isValidId('abc-123_XYZ'), true);
    assert.strictEqual(isValidId(''), false);
    assert.strictEqual(isValidId('../etc/passwd'), false);
    assert.strictEqual(isValidId('receipt/123'), false);
    assert.strictEqual(isValidId('receipt;rm -rf'), false);

    // ----------------------------------------------------
    // 2. Split calculation
    // ----------------------------------------------------
    console.log('Testing calculateSplit...');
    const splitCalc = calculateSplit({
      items: [
        {
          id: 'i1',
          description: 'Pizza',
          quantity: 1,
          unitPrice: 20,
          totalPrice: 20,
          assignedParticipantIds: ['p1', 'p2'],
        },
        {
          id: 'i2',
          description: 'Cerveza',
          quantity: 2,
          unitPrice: 5,
          totalPrice: 10,
          assignedParticipantIds: ['p2'],
        },
      ],
      participants: [
        { id: 'p1', name: 'Ana' },
        { id: 'p2', name: 'Carlos' },
      ],
      subtotal: 30,
      tax: 3,
      tip: 3,
      total: 36,
    });

    assert.strictEqual(splitCalc.items.length, 3); // 2 shares for Pizza, 1 for Cerveza
    assert.strictEqual(splitCalc.participants.length, 2);
    const anaSplit = splitCalc.participants.find((p) => p.participantId === 'p1')!;
    const carlosSplit = splitCalc.participants.find((p) => p.participantId === 'p2')!;
    assert.strictEqual(anaSplit.subtotal, 10);
    assert.strictEqual(anaSplit.tax, 1);
    assert.strictEqual(anaSplit.tip, 1);
    assert.strictEqual(anaSplit.total, 12);
    assert.strictEqual(carlosSplit.subtotal, 20);
    assert.strictEqual(carlosSplit.tax, 2);
    assert.strictEqual(carlosSplit.tip, 2);
    assert.strictEqual(carlosSplit.total, 24);

    // ----------------------------------------------------
    // 3. Storage CRUD and Atomic writes
    // ----------------------------------------------------
    console.log('Testing storage CRUD operations...');
    const receipt1 = await createReceipt({
      title: 'Restaurante Central',
      date: '2026-03-15',
      currency: 'USD',
      participants: [
        { id: 'p1', name: 'Lucia' },
        { id: 'p2', name: 'Marcos' },
      ],
      items: [
        {
          description: 'Ensalada',
          totalPrice: 15,
          assignedParticipantIds: ['p1'],
        },
        {
          description: 'Pasta',
          totalPrice: 25,
          assignedParticipantIds: ['p2'],
        },
      ],
      tax: 4,
      tip: 4,
    });

    assert.ok(receipt1.id);
    assert.strictEqual(receipt1.title, 'Restaurante Central');
    assert.strictEqual(receipt1.subtotal, 40);
    assert.strictEqual(receipt1.total, 48);
    assert.strictEqual(receipt1.status, 'draft');

    // Verify file exists on disk
    const filePath = path.join(testDataDir, `${receipt1.id}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsedFile = JSON.parse(fileContent);
    assert.strictEqual(parsedFile.id, receipt1.id);

    // Check no temp files left behind
    const dirEntries = await fs.readdir(testDataDir);
    const tempFiles = dirEntries.filter((f) => f.startsWith('.tmp'));
    assert.strictEqual(tempFiles.length, 0);

    // Direct test for writeAtomicJson
    console.log('Testing writeAtomicJson directly...');
    const customJsonPath = path.join(testDataDir, 'custom.json');
    await writeAtomicJson(customJsonPath, { custom: 'value' });
    const customContent = JSON.parse(await fs.readFile(customJsonPath, 'utf-8'));
    assert.strictEqual(customContent.custom, 'value');

    // Get by ID
    const fetched = await getReceiptById(receipt1.id);
    assert.ok(fetched);
    assert.strictEqual(fetched?.id, receipt1.id);

    // Non-existent ID
    const notFound = await getReceiptById('non-existent-id');
    assert.strictEqual(notFound, null);

    // Update receipt
    const updated = await updateReceipt(receipt1.id, {
      title: 'Restaurante Central - Actualizado',
      status: 'pending',
    });
    assert.ok(updated);
    assert.strictEqual(updated?.title, 'Restaurante Central - Actualizado');
    assert.strictEqual(updated?.status, 'pending');

    // Verify update persisted to disk
    const fetchedAfterUpdate = await getReceiptById(receipt1.id);
    assert.strictEqual(fetchedAfterUpdate?.title, 'Restaurante Central - Actualizado');
    assert.strictEqual(fetchedAfterUpdate?.status, 'pending');

    // Create second receipt to test ordering
    const receipt2 = await createReceipt({
      title: 'Supermercado',
      date: '2026-03-20',
      total: 50,
    });

    const all = await getAllReceipts();
    assert.strictEqual(all.length, 2);
    // Should be ordered by date descending (2026-03-20 before 2026-03-15)
    assert.strictEqual(all[0].id, receipt2.id);
    assert.strictEqual(all[1].id, receipt1.id);

    // Concurrency test: write 10 receipts simultaneously
    console.log('Testing concurrent atomic writes...');
    const promises = Array.from({ length: 10 }, (_, i) =>
      createReceipt({
        title: `Concurrent Receipt ${i}`,
        date: `2026-03-${10 + i}`,
        total: (i + 1) * 10,
      })
    );
    const concurrentReceipts = await Promise.all(promises);
    assert.strictEqual(concurrentReceipts.length, 10);

    const allAfterConcurrency = await getAllReceipts();
    assert.strictEqual(allAfterConcurrency.length, 12);

    // Delete receipt
    console.log('Testing deleteReceipt...');
    const deleted = await deleteReceipt(receipt1.id);
    assert.strictEqual(deleted, true);
    const secondDelete = await deleteReceipt(receipt1.id);
    assert.strictEqual(secondDelete, false);

    const afterDelete = await getReceiptById(receipt1.id);
    assert.strictEqual(afterDelete, null);

    // ----------------------------------------------------
    // 4. API Route Handlers
    // ----------------------------------------------------
    console.log('Testing API route handlers...');

    // GET /api/receipts
    const getRes = await getReceiptsRoute();
    assert.strictEqual(getRes.status, 200);
    const receiptsList = await getRes.json();
    assert.ok(Array.isArray(receiptsList));
    assert.strictEqual(receiptsList.length, 11);

    // POST /api/receipts - validation failures
    const invalidJsonReq = new Request('http://localhost/api/receipts', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const invalidJsonRes = await postReceiptRoute(invalidJsonReq);
    assert.strictEqual(invalidJsonRes.status, 400);

    const missingTitleReq = new Request('http://localhost/api/receipts', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const missingTitleRes = await postReceiptRoute(missingTitleReq);
    assert.strictEqual(missingTitleRes.status, 400);

    // POST /api/receipts - successful creation
    const postReq = new Request('http://localhost/api/receipts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Café de Especialidad',
        date: '2026-04-01',
        currency: 'EUR',
        items: [
          { description: 'Capuccino', quantity: 2, unitPrice: 3.5, totalPrice: 7 },
        ],
        participants: [
          { name: 'Elena' },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const postRes = await postReceiptRoute(postReq);
    assert.strictEqual(postRes.status, 201);
    const createdFromApi = await postRes.json();
    assert.ok(createdFromApi.id);
    assert.strictEqual(createdFromApi.title, 'Café de Especialidad');
    assert.strictEqual(createdFromApi.items.length, 1);
    assert.strictEqual(createdFromApi.participants.length, 1);
    assert.strictEqual(createdFromApi.currency, 'EUR');

    // GET /api/receipts/[id] - success
    const getByIdRes = await getReceiptByIdRoute(
      new Request(`http://localhost/api/receipts/${createdFromApi.id}`),
      { params: Promise.resolve({ id: createdFromApi.id }) }
    );
    assert.strictEqual(getByIdRes.status, 200);
    const fetchedFromApi = await getByIdRes.json();
    assert.strictEqual(fetchedFromApi.id, createdFromApi.id);

    // GET /api/receipts/[id] - not found
    const notFoundRes = await getReceiptByIdRoute(
      new Request('http://localhost/api/receipts/non-existent-receipt'),
      { params: Promise.resolve({ id: 'non-existent-receipt' }) }
    );
    assert.strictEqual(notFoundRes.status, 404);

    // GET /api/receipts/[id] - invalid id
    const invalidIdRes = await getReceiptByIdRoute(
      new Request('http://localhost/api/receipts/bad/id'),
      { params: Promise.resolve({ id: '../bad-path' }) }
    );
    assert.strictEqual(invalidIdRes.status, 400);

    // PUT /api/receipts/[id] - success
    const putReq = new Request(`http://localhost/api/receipts/${createdFromApi.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Café & Bakery',
        status: 'settled',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const putRes = await putReceiptByIdRoute(putReq, {
      params: Promise.resolve({ id: createdFromApi.id }),
    });
    assert.strictEqual(putRes.status, 200);
    const updatedFromApi = await putRes.json();
    assert.strictEqual(updatedFromApi.title, 'Café & Bakery');
    assert.strictEqual(updatedFromApi.status, 'settled');

    // PUT /api/receipts/[id] - not found
    const putNotFoundRes = await putReceiptByIdRoute(
      new Request('http://localhost/api/receipts/non-existent-receipt', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Algo' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'non-existent-receipt' }) }
    );
    assert.strictEqual(putNotFoundRes.status, 404);

    // DELETE /api/receipts/[id] - success
    const deleteRes = await deleteReceiptByIdRoute(
      new Request(`http://localhost/api/receipts/${createdFromApi.id}`, {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: createdFromApi.id }) }
    );
    assert.strictEqual(deleteRes.status, 204);

    // DELETE /api/receipts/[id] - not found after deletion
    const deleteNotFoundRes = await deleteReceiptByIdRoute(
      new Request(`http://localhost/api/receipts/${createdFromApi.id}`, {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: createdFromApi.id }) }
    );
    assert.strictEqual(deleteNotFoundRes.status, 404);

    console.log('All tests passed successfully! 🎉');
  } finally {
    // Cleanup test directory
    await fs.rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
