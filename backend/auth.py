import hashlib
import hmac
import time
from operator import itemgetter
from urllib.parse import parse_qsl
from config import BOT_TOKEN

def validate_init_data(init_data: str) -> bool:
    if not init_data:
        return False
    
    try:
        parsed_data = dict(parse_qsl(init_data))
        hash_str = parsed_data.pop('hash')
        data_check_string = "\n".join([f"{k}={v}" for k, v in sorted(parsed_data.items(), key=itemgetter(0))])
        
        secret_key = hmac.new("WebAppData".encode(), BOT_TOKEN.encode(), hashlib.sha256).digest()
        hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        return hmac_hash == hash_str
    except Exception:
        return False
