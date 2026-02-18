"""
Custom middleware for TINCHO Barbería
"""
from django.utils.deprecation import MiddlewareMixin


class DisableCSRFForAPIMiddleware(MiddlewareMixin):
    """
    Deshabilita la verificación CSRF para endpoints de la API
    que usan Token Authentication
    """
    def process_request(self, request):
        # Eximir todas las rutas /api/ de CSRF
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
