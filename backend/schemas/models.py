from pydantic import BaseModel
from typing import List, Optional

class IntentOutput(BaseModel):
    app_name: str
    features: List[str]
    roles: List[str]
    entities: List[str]
    has_payments: bool
    has_auth: bool

class UIPage(BaseModel):
    name: str
    route: str
    components: List[str]
    allowed_roles: List[str]

class APIEndpoint(BaseModel):
    method: str
    path: str
    description: str
    auth_required: bool
    roles: List[str]

class DBTable(BaseModel):
    name: str
    fields: List[str]
    relations: List[str]

class AuthRule(BaseModel):
    role: str
    permissions: List[str]

class AppConfig(BaseModel):
    app_name: str
    ui: List[UIPage]
    api: List[APIEndpoint]
    db: List[DBTable]
    auth: List[AuthRule]