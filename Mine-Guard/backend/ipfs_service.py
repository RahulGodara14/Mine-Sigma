import requests
from typing import Optional
from config import settings

class IPFSService:
    def __init__(self) -> None:
        self.base_url = "https://api.pinata.cloud"
        self.session = requests.Session()
        # Prefer JWT if provided, else fallback to key/secret
        if settings.pinata_jwt:
            self.session.headers.update({
                "Authorization": f"Bearer {settings.pinata_jwt}",
            })
        else:
            if settings.pinata_api_key:
                self.session.headers.update({"pinata_api_key": settings.pinata_api_key})
            if settings.pinata_secret_key:
                self.session.headers.update({"pinata_secret_api_key": settings.pinata_secret_key})

    def pin_file(self, file_tuple) -> str:
        url = f"{self.base_url}/pinning/pinFileToIPFS"
        files = {"file": file_tuple}
        resp = self.session.post(url, files=files)
        resp.raise_for_status()
        return resp.json()["IpfsHash"]

    def pin_json(self, payload: dict, name: Optional[str] = None) -> str:
        url = f"{self.base_url}/pinning/pinJSONToIPFS"
        body = {
            "pinataContent": payload,
            "pinataMetadata": {"name": name or f"report-{__import__('time').time()}"}
        }
        resp = self.session.post(url, json=body)
        resp.raise_for_status()
        return resp.json()["IpfsHash"]

ipfs_service = IPFSService()
