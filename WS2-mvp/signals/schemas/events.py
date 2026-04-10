"""Event schemas for the Jio signal pipeline.

These define what each type of event looks like as it flows through
Pub/Sub -> Processor -> Agent.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
import json


@dataclass
class BillingEvent:
    """Raw billing event - data usage, recharge, payment."""
    customer_id: str
    event_type: str  # data_usage, recharge, payment_due, payment_received
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    # data_usage fields
    data_used_pct: float = 0.0
    data_used_gb: float = 0.0
    data_limit_gb: float = 0.0
    # recharge fields
    amount_inr: float = 0.0
    plan_name: str = ""
    # payment fields
    days_until_due: int = 0
    overdue: bool = False

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "BillingEvent":
        return cls(**json.loads(data))


@dataclass
class NetworkEvent:
    """Raw network event - QoE, outages, signal quality."""
    customer_id: str
    event_type: str  # qoe_drop, outage_start, outage_end, latency_spike, signal_change
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    # QoE fields
    download_speed_mbps: float = 0.0
    upload_speed_mbps: float = 0.0
    latency_ms: int = 0
    packet_loss_pct: float = 0.0
    # Signal fields
    wifi_signal: str = ""  # strong, medium, weak
    connection_type: str = ""  # fiber, FWA
    # Outage fields
    outage_duration_minutes: int = 0
    affected_area: str = ""

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "NetworkEvent":
        return cls(**json.loads(data))


@dataclass
class AppEvent:
    """Raw app event - customer interactions in MyJio app."""
    customer_id: str
    event_type: str  # app_open, page_view, complaint_view, plan_compare, support_tap
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    page: str = ""  # which page/screen
    duration_seconds: int = 0
    session_id: str = ""

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "AppEvent":
        return cls(**json.loads(data))


@dataclass
class DeviceEvent:
    """Raw device event - CPE heartbeat, router status."""
    customer_id: str
    event_type: str  # heartbeat, cpe_offline, cpe_online, firmware_update, temp_warning
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    cpe_model: str = ""
    cpe_status: str = ""  # online, offline, degraded
    wifi_2g_signal: str = ""
    wifi_5g_signal: str = ""
    connected_devices: int = 0
    temperature_celsius: int = 0
    uptime_hours: int = 0

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "DeviceEvent":
        return cls(**json.loads(data))


@dataclass
class CustomerProfile:
    """Enrichment data - attached to events during processing."""
    customer_id: str
    name: str
    plan_name: str
    plan_speed_mbps: int
    plan_price_inr: int
    tenure_days: int
    language: str  # hi, en, hinglish, mr
    channel_preference: str  # app, voice, whatsapp
    nps_score: int
    complaints_count: int
    risk_level: str  # low, medium, high
    household_size: int


@dataclass
class EnrichedEvent:
    """Output of the processor - ready for the agent spine.

    This is what the agent receives. It contains:
    - The interpreted business event (not raw telemetry)
    - Full customer context
    - Urgency and recommended action type
    """
    # Event identity
    event_id: str
    timestamp: str
    source_topic: str  # which raw topic this came from

    # Interpreted signal
    signal_type: str  # approaching_data_cap, network_degraded, churn_risk, etc.
    urgency: str  # low, medium, high, critical
    raw_event_summary: str  # human-readable summary of what happened

    # Customer context (from enrichment)
    customer_id: str
    customer_name: str
    customer_language: str
    customer_plan: str
    customer_tenure_days: int
    customer_nps: int
    customer_risk: str
    customer_channel: str
    customer_complaints: int
    customer_household_size: int

    # Pilot criteria
    in_pilot_segment: bool = True
    contact_allowed: bool = True  # not already contacted today
    exposure_mode: str = "shadow"  # shadow, advisory, controlled

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "EnrichedEvent":
        return cls(**json.loads(data))
