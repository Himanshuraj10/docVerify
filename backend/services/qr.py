import io
import base64
import qrcode
from qrcode.image.pil import PilImage

class QRService:
    @staticmethod
    def generate_verification_qr(verification_id: str, base_url: str = "") -> dict:
        """
        Generates QR code for public verification.
        Points to /verify/{verification_id}.
        """
        relative_url = f"/verify/{verification_id}"
        full_url = f"{base_url.rstrip('/')}{relative_url}" if base_url else relative_url

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(full_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_bytes = buffer.getvalue()
        b64_str = base64.b64encode(qr_bytes).decode("utf-8")
        data_url = f"data:image/png;base64,{b64_str}"

        return {
            "verification_url": relative_url,
            "qr_data_url": data_url
        }
