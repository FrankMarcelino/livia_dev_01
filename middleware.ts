import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware de Assinatura
 *
 * Intercepta rotas do dashboard e verifica status da assinatura.
 * - canceled/inactive → redirect para /financeiro/recarregar
 * - past_due → permite acesso + header X-Subscription-Warning
 * - Rotas públicas são ignoradas
 *
 * Cache: status da assinatura é lido via cookie 'x-sub-status' com TTL de 5 min.
 * O webhook do Stripe atualiza o banco, e o cookie expira naturalmente.
 */

const PUBLIC_ROUTES = [
  '/login',
  '/api/stripe/webhook',
  '/financeiro/checkout',
];

const SUBSCRIPTION_CACHE_TTL_SECONDS = 300; // 5 minutos

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isDashboardRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/financeiro') ||
    pathname.startsWith('/livechat') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/knowledge-base') ||
    pathname.startsWith('/neurocore') ||
    pathname.startsWith('/meus-agentes') ||
    pathname.startsWith('/configuracoes') ||
    pathname.startsWith('/reativacao') ||
    pathname.startsWith('/relatorios')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and non-dashboard routes
  if (isPublicRoute(pathname) || !isDashboardRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow recarregar page even for canceled subscriptions (they need to resubscribe)
  if (pathname === '/financeiro/recarregar') {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // Create Supabase client for Edge Runtime
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check cached subscription status
  const cachedStatus = request.cookies.get('x-sub-status')?.value;
  const cachedPeriodEnd = request.cookies.get('x-sub-period-end')?.value;

  let subscriptionStatus: string | null = cachedStatus || null;
  let periodEnd: string | null = cachedPeriodEnd || null;

  if (!subscriptionStatus) {
    // Fetch from DB
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userData?.tenant_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tenant } = await (supabase as any)
        .from('tenants')
        .select('subscription_status, subscription_current_period_end')
        .eq('id', userData.tenant_id)
        .single();

      subscriptionStatus = tenant?.subscription_status || 'inactive';
      periodEnd = tenant?.subscription_current_period_end || null;

      // Cache in cookies
      response.cookies.set('x-sub-status', subscriptionStatus!, {
        maxAge: SUBSCRIPTION_CACHE_TTL_SECONDS,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      if (periodEnd) {
        response.cookies.set('x-sub-period-end', periodEnd, {
          maxAge: SUBSCRIPTION_CACHE_TTL_SECONDS,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        });
      }
    }
  }

  // Redirect if subscription is canceled or inactive
  if (subscriptionStatus === 'canceled' || subscriptionStatus === 'inactive') {
    const rechargeUrl = new URL('/financeiro/recarregar', request.url);
    return NextResponse.redirect(rechargeUrl);
  }

  // Set warning header for past_due
  if (subscriptionStatus === 'past_due') {
    response.headers.set('X-Subscription-Warning', 'past_due');
  }

  // Set headers for layout to read subscription info
  if (subscriptionStatus) {
    response.headers.set('X-Subscription-Status', subscriptionStatus);
  }
  if (periodEnd) {
    response.headers.set('X-Subscription-Period-End', periodEnd);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
