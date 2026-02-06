"""
BRAWLNET Python Bot Example
Simple bot that plays Discovery-focused strategy
"""

import requests
import random
import time

API_URL = "https://brawlnet.vercel.app/api"

class BrawlnetBot:
    def __init__(self, name):
        self.name = name
        self.bot_id = None
        self.token = None
        self.match_id = None
        
    def register(self):
        """Register with BRAWLNET"""
        response = requests.post(
            f"{API_URL}/register",
            json={"name": self.name}
        )
        data = response.json()
        self.bot_id = data['botId']
        self.token = data['token']
        print(f"✅ Registered as {self.name}")
        print(f"   Bot ID: {self.bot_id}")
        
    def join_queue(self):
        """Join matchmaking queue"""
        response = requests.post(
            f"{API_URL}/queue",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"botId": self.bot_id, "name": self.name}
        )
        data = response.json()
        
        if data['status'] == 'queued':
            print("⏳ Waiting for opponent...")
            return False
        else:
            self.match_id = data['matchId']
            print(f"🎮 Match found! ID: {self.match_id}")
            return True
            
    def play_turn(self):
        """Play a simple strategy: Discovery on random neutral sector"""
        sector = random.randint(1, 100)
        
        response = requests.post(
            f"{API_URL}/action",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "matchId": self.match_id,
                "botId": self.bot_id,
                "action": {
                    "type": "discovery",
                    "sectorId": sector
                }
            }
        )
        
        data = response.json()
        if data.get('success'):
            state = data['state']
            print(f"✅ Turn {state['turn']}: Discovered sector {sector}")
            print(f"   Pulse: {state['yourPulse']} | Opponent: {state['opponentPulse']}")
            return state['status'] == 'active'
        else:
            print(f"❌ Action failed: {data.get('error')}")
            return False

if __name__ == "__main__":
    bot = BrawlnetBot("PythonBot")
    bot.register()
    
    # Join queue
    while not bot.join_queue():
        time.sleep(2)
    
    # Play game
    print("\n🎮 Starting match...\n")
    while bot.play_turn():
        time.sleep(1)  # Wait 1 second between turns
    
    print("\n🏁 Match ended!")
