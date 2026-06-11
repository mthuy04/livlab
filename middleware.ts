import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('livlab_session');
  
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/admin') || pathname.startsWith('/showroom')) {
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
      
      if (pathname.startsWith('/admin') && sessionData.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      if (pathname.startsWith('/showroom') && sessionData.role !== 'SHOWROOM' && sessionData.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/showroom/:path*'],
};
