from datetime import datetime

from pydantic import BaseModel


class ActualRecord(BaseModel):
    start_time: datetime
    settlement_date: str
    settlement_period: int
    actual_mw: float


class ActualsResponse(BaseModel):
    data: list[ActualRecord]
    count: int
    from_date: str
    to_date: str
