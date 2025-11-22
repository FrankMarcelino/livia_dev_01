/**
 * Endpoint de diagnóstico para testar execução assíncrona em produção (Vercel)
 *
 * GET /api/debug/test-async
 *
 * Testa se Promises executam após retornar response em ambiente serverless
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();

  console.error('[test-async] 🚀 Starting test...');

  // Teste 1: Promise.resolve().then() (pode NÃO executar em Vercel)
  Promise.resolve().then(() => {
    console.error('[test-async] ⚠️ Promise.resolve().then() - Se você vê isso, a Promise executou!');
  });

  // Teste 2: Função async sem await (pode NÃO executar em Vercel)
  (async () => {
    console.error('[test-async] ⚠️ Async IIFE - Se você vê isso, o async executou!');
  })();

  // Teste 3: setTimeout (NUNCA executa em Vercel após response)
  setTimeout(() => {
    console.error('[test-async] ⚠️ setTimeout - Se você vê isso, setTimeout executou!');
  }, 10);

  // Teste 4: Função async com await (DEVE executar)
  await testAwaitExecution();

  const totalTime = Date.now() - startTime;
  console.error(`[test-async] ✅ Response sent after ${totalTime}ms`);

  return NextResponse.json({
    message: 'Test async execution',
    timestamp: new Date().toISOString(),
    duration: totalTime,
    instructions: 'Check Vercel logs for [test-async] messages to see which methods executed'
  });
}

async function testAwaitExecution() {
  console.error('[test-async] ✅ Awaited function - This SHOULD always execute');
  return true;
}
