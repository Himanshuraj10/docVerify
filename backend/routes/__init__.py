from backend.routes.verification import router as verification_router
from backend.routes.public import router as public_router
from backend.routes.complaints import router as complaints_router
from backend.routes.faqs import router as faqs_router
from backend.routes.admin import router as admin_router
from backend.routes.owner import router as owner_router

__all__ = [
    "verification_router",
    "public_router",
    "complaints_router",
    "faqs_router",
    "admin_router",
    "owner_router"
]
