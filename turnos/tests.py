from django.test import TestCase
from django.utils import timezone
from datetime import date, time
from .models import Barbero, Servicio, Turno, EstadoTurno


class BarberoModelTest(TestCase):
    """Tests para el modelo Barbero"""
    
    def setUp(self):
        self.barbero = Barbero.objects.create(
            nombre='Juan Pérez',
            telefono='+541112345678',
            color_hex='#FF0000'
        )
    
    def test_barbero_creation(self):
        """Test de creación de barbero"""
        self.assertEqual(self.barbero.nombre, 'Juan Pérez')
        self.assertTrue(self.barbero.is_active)
        self.assertEqual(self.barbero.color_hex, '#FF0000')
    
    def test_barbero_str(self):
        """Test del método __str__"""
        self.assertIn('Juan Pérez', str(self.barbero))


class ServicioModelTest(TestCase):
    """Tests para el modelo Servicio"""
    
    def setUp(self):
        self.servicio = Servicio.objects.create(
            nombre='Corte de Cabello',
            precio=5000.00,
            duracion_minutos=30
        )
    
    def test_servicio_creation(self):
        """Test de creación de servicio"""
        self.assertEqual(self.servicio.nombre, 'Corte de Cabello')
        self.assertEqual(self.servicio.precio, 5000.00)
        self.assertTrue(self.servicio.is_active)


class TurnoModelTest(TestCase):
    """Tests para el modelo Turno"""
    
    def setUp(self):
        self.barbero = Barbero.objects.create(
            nombre='Carlos López',
            telefono='+541112345678'
        )
        self.servicio = Servicio.objects.create(
            nombre='Barba',
            precio=3000.00,
            duracion_minutos=20
        )
        self.turno = Turno.objects.create(
            fecha=date.today(),
            hora=time(14, 0),
            barbero=self.barbero,
            servicio=self.servicio,
            cliente_nombre='Pedro García',
            cliente_telefono='+541198765432',
            estado=EstadoTurno.PENDIENTE
        )
    
    def test_turno_creation(self):
        """Test de creación de turno"""
        self.assertEqual(self.turno.cliente_nombre, 'Pedro García')
        self.assertEqual(self.turno.estado, EstadoTurno.PENDIENTE)
    
    def test_turno_properties(self):
        """Test de propiedades calculadas"""
        self.assertEqual(self.turno.duracion_total, 20)
        self.assertEqual(self.turno.precio_total, 3000.00)
