from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado: Solo lectura para todos, escritura solo para admin.
    """
    def has_permission(self, request, view):
        # Permitir métodos seguros (GET, HEAD, OPTIONS) para todos
        if request.method in permissions.SAFE_METHODS:
            return True
        # Solo admin puede modificar
        return request.user and request.user.is_staff


class IsPublicEndpoint(permissions.BasePermission):
    """
    Permiso para endpoints públicos (clientes).
    Permite acceso sin autenticación.
    """
    def has_permission(self, request, view):
        return True
