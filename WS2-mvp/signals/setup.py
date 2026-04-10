"""Create Pub/Sub topics and subscriptions for the Jio signal pipeline.

Idempotent - safe to run multiple times. Skips topics/subs that already exist.

Usage:
    python setup.py
    python setup.py --delete  # tear down everything
"""

import argparse
import sys
from google.cloud import pubsub_v1
from google.api_core.exceptions import AlreadyExists, NotFound

PROJECT_ID = "jiobuddy-492811"

# Event topics - raw signals from Jio systems (simulated)
EVENT_TOPICS = [
    "jio-billing-events",
    "jio-network-events",
    "jio-app-events",
    "jio-device-events",
]

# Trigger topic - enriched events ready for the agent
TRIGGER_TOPIC = "jio-agent-triggers"

# All topics
ALL_TOPICS = EVENT_TOPICS + [TRIGGER_TOPIC]

# Subscriptions - processor subscribes to event topics, agent subscribes to triggers
SUBSCRIPTIONS = {
    "jio-billing-events-processor": "jio-billing-events",
    "jio-network-events-processor": "jio-network-events",
    "jio-app-events-processor": "jio-app-events",
    "jio-device-events-processor": "jio-device-events",
    "jio-agent-triggers-agent": "jio-agent-triggers",
}


def create_all():
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    # Create topics
    for topic_id in ALL_TOPICS:
        topic_path = publisher.topic_path(PROJECT_ID, topic_id)
        try:
            publisher.create_topic(request={"name": topic_path})
            print(f"  created topic: {topic_id}")
        except AlreadyExists:
            print(f"  exists topic:  {topic_id}")

    # Create subscriptions
    for sub_id, topic_id in SUBSCRIPTIONS.items():
        sub_path = subscriber.subscription_path(PROJECT_ID, sub_id)
        topic_path = publisher.topic_path(PROJECT_ID, topic_id)
        try:
            subscriber.create_subscription(
                request={
                    "name": sub_path,
                    "topic": topic_path,
                    "ack_deadline_seconds": 60,
                }
            )
            print(f"  created sub:   {sub_id} -> {topic_id}")
        except AlreadyExists:
            print(f"  exists sub:    {sub_id} -> {topic_id}")

    print("\nDone. Pipeline ready.")
    print(f"\nTopics: {len(ALL_TOPICS)}")
    print(f"Subscriptions: {len(SUBSCRIPTIONS)}")


def delete_all():
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    for sub_id in SUBSCRIPTIONS:
        sub_path = subscriber.subscription_path(PROJECT_ID, sub_id)
        try:
            subscriber.delete_subscription(request={"subscription": sub_path})
            print(f"  deleted sub:   {sub_id}")
        except NotFound:
            pass

    for topic_id in ALL_TOPICS:
        topic_path = publisher.topic_path(PROJECT_ID, topic_id)
        try:
            publisher.delete_topic(request={"topic": topic_path})
            print(f"  deleted topic: {topic_id}")
        except NotFound:
            pass

    print("\nTorn down.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--delete", action="store_true", help="Delete all topics and subscriptions")
    args = parser.parse_args()

    if args.delete:
        print("Tearing down Pub/Sub pipeline...")
        delete_all()
    else:
        print("Setting up Pub/Sub pipeline...")
        create_all()
