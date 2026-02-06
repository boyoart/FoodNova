import africastalking
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class SMSService:
    """Service for sending SMS notifications via Africa's Talking"""
    
    def __init__(self, username: str, api_key: str):
        """Initialize Africa's Talking SDK"""
        self.username = username
        self.api_key = api_key
        self.initialized = False
        
        if username and api_key:
            try:
                africastalking.initialize(username=username, api_key=api_key)
                self.sms = africastalking.SMS
                self.initialized = True
                logger.info("Africa's Talking SMS service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize SMS service: {e}")
    
    def format_phone_number(self, phone: str) -> str:
        """Format phone number to international format for Nigeria"""
        # Remove spaces and dashes
        phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        
        # Handle Nigerian numbers
        if phone.startswith("0"):
            phone = "+234" + phone[1:]
        elif phone.startswith("234"):
            phone = "+" + phone
        elif not phone.startswith("+"):
            phone = "+234" + phone
        
        return phone
    
    def send_sms(self, phone_number: str, message: str) -> dict:
        """
        Send SMS notification
        
        Args:
            phone_number: Customer's phone number
            message: SMS message content
            
        Returns:
            Dictionary with send status
        """
        if not self.initialized:
            logger.warning("SMS service not initialized, skipping SMS")
            return {"success": False, "error": "SMS service not configured"}
        
        try:
            formatted_phone = self.format_phone_number(phone_number)
            response = self.sms.send(message, [formatted_phone])
            
            logger.info(f"SMS sent to {formatted_phone}: {response}")
            
            # Check response
            if response.get('SMSMessageData', {}).get('Recipients'):
                recipient = response['SMSMessageData']['Recipients'][0]
                return {
                    "success": recipient.get('status') == 'Success',
                    "message_id": recipient.get('messageId'),
                    "status": recipient.get('status'),
                    "cost": recipient.get('cost')
                }
            
            return {"success": True, "response": response}
        
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_order_placed(self, phone: str, order_id: int, customer_name: str, total: int) -> dict:
        """Send notification when order is placed"""
        message = f"Hi {customer_name}, your FoodNova order #{order_id} has been placed! Total: ₦{total:,}. Please upload your payment receipt to confirm."
        return self.send_sms(phone, message)
    
    def send_order_paid(self, phone: str, order_id: int, customer_name: str) -> dict:
        """Send notification when payment is verified"""
        message = f"Hi {customer_name}, payment for your FoodNova order #{order_id} has been verified! Your order is being processed."
        return self.send_sms(phone, message)
    
    def send_order_confirmed(self, phone: str, order_id: int, customer_name: str) -> dict:
        """Send notification when order is confirmed"""
        message = f"Hi {customer_name}, your FoodNova order #{order_id} has been confirmed and is being prepared for delivery/pickup."
        return self.send_sms(phone, message)
    
    def send_order_out_for_delivery(self, phone: str, order_id: int, customer_name: str) -> dict:
        """Send notification when order is out for delivery"""
        message = f"Hi {customer_name}, your FoodNova order #{order_id} is out for delivery! Please have your delivery fee ready."
        return self.send_sms(phone, message)
    
    def send_receipt_approved(self, phone: str, order_id: int, customer_name: str) -> dict:
        """Send notification when receipt is approved"""
        message = f"Hi {customer_name}, your payment receipt for FoodNova order #{order_id} has been approved! Your order will be processed shortly."
        return self.send_sms(phone, message)
    
    def send_receipt_rejected(self, phone: str, order_id: int, customer_name: str, reason: Optional[str] = None) -> dict:
        """Send notification when receipt is rejected"""
        base_msg = f"Hi {customer_name}, your payment receipt for FoodNova order #{order_id} was not approved."
        if reason:
            message = f"{base_msg} Reason: {reason}. Please upload a valid receipt."
        else:
            message = f"{base_msg} Please upload a valid receipt."
        return self.send_sms(phone, message)


# Global SMS service instance (initialized in main.py)
sms_service: Optional[SMSService] = None


def get_sms_service() -> Optional[SMSService]:
    """Get the global SMS service instance"""
    return sms_service


def init_sms_service(username: str, api_key: str):
    """Initialize the global SMS service"""
    global sms_service
    sms_service = SMSService(username, api_key)
    return sms_service
