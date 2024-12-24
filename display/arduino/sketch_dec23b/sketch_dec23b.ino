#include <MD_Parola.h>
#include <MD_MAX72xx.h>
#include <SPI.h>

constexpr auto HW_TYPE = MD_MAX72XX::FC16_HW;
constexpr auto DISPLAY_DEVICES = 4;
constexpr auto CS_PIN = 6;

MD_Parola myDisplay = MD_Parola(HW_TYPE, CS_PIN, DISPLAY_DEVICES);

constexpr uint8_t SYNC_BYTE = 0b01010101;
constexpr uint8_t DISP_ZONE_TRAM = 0;
constexpr uint8_t DISP_ZONE_MINS = 1;
constexpr uint8_t DISP_ZONE_ALL = 0;

void setup() {

	// Intialize the object
	myDisplay.begin(2);

	// Set the intensity (brightness) of the display (0-15)
	myDisplay.setIntensity(0);
  myDisplay.setInvert(false);

  Serial.begin(9600);
}


bool gotSyncByte = false;
/**
 * Tries to read the sync byte and returns true if data ready
 **/
bool hasSyncByte() {
    if(Serial.available() > 0) {
      auto const result = Serial.read();
      if(result == SYNC_BYTE) {
        return true;
      }
    }
    return false;
}

bool waitForSyncByte(bool sendSync = false) {
  uint8_t syncIt = 0;
  while(!hasSyncByte()) {
    delay(100);
    if(sendSync && syncIt > 6) {
      syncIt = 0;
      Serial.write(SYNC_BYTE);
    }
    ++syncIt;
  }
};

struct TramConnection {
  uint8_t minutesUntil = 0;
  uint8_t connNumber = 0;
  uint32_t timeCreated = 0;

  uint8_t getMinutes() const {
    uint32_t deltaMins = (millis()/1000 - timeCreated)/60;
    return deltaMins < minutesUntil ? minutesUntil - deltaMins : 0;
  }
};


auto readTram() -> TramConnection {
  TramConnection result;
  while(Serial.available() < 2) {
    delay(100);
  }
  result.connNumber = Serial.read();
  result.minutesUntil = Serial.read();
  result.timeCreated = millis()/1000;
  return result;
}

char letters[8] = {0};

bool waitZoneComplete() {
  if(!myDisplay.displayAnimate()) {
    return false;
  }
  bool allDone = true;
  for (uint8_t i=0; i<2 && allDone; i++)
  {
    allDone = allDone && myDisplay.getZoneStatus(i);
  }
  if(!allDone) {
    return false;
  }
  return true;
}

void waitZoneForever() {
  while(!waitZoneComplete());
}

void setZonesTram() {
  waitZoneForever();
  myDisplay.setZone(DISP_ZONE_TRAM, 2, 3);
  myDisplay.setZone(DISP_ZONE_MINS, 0, 1);
}

void setZonesFull() {
  waitZoneForever();
  myDisplay.setZone(DISP_ZONE_ALL, 0, 3);
  myDisplay.setIntensity(0);
  myDisplay.setInvert(false);
}

void loop() {
  waitZoneForever();

  // // // myDisplay.setZone(DISP_ZONE_TRAM, 0, 1);
  // // // myDisplay.setZone(DISP_ZONE_MINS, 2, 3);
  // myDisplay.setZone(DISP_ZONE_TRAM, 2, 3);
  // myDisplay.setZone(DISP_ZONE_MINS, 0, 1);
  
  // myDisplay.displayZoneText(DISP_ZONE_TRAM, "L", PA_LEFT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
  // //myDisplay.displayReset(DISP_ZONE_TRAM);

  
  // myDisplay.displayZoneText(DISP_ZONE_MINS, "R", PA_RIGHT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
  // //myDisplay.displayReset(DISP_ZONE_MINS);
  // //myDisplay.synchZoneStart();
  // waitZoneForever();
  // delay(1000);
  // myDisplay.setZone(DISP_ZONE_ALL, 0, 3);
  // myDisplay.displayZoneText(DISP_ZONE_ALL, "FULL DISP", PA_RIGHT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
  // myDisplay.displayReset(DISP_ZONE_ALL);
  // waitZoneForever();
  // delay(1000);
  // return;
	
  setZonesFull();
  myDisplay.displayZoneText(DISP_ZONE_ALL, "Wait...", PA_LEFT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
  waitZoneForever();
	//myDisplay.setZone(DISP_ZONE_ALL, 0, 3);
  //myDisplay.displayText("Load...", PA_LEFT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);

	waitForSyncByte(true);
  myDisplay.displayZoneText(DISP_ZONE_ALL, ".-.-.-.", PA_LEFT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
  waitZoneForever();
  //myDisplay.displayText( "OK!", PA_LEFT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
  delay(500);
  auto connection = readTram();
  setZonesTram();

  while(true)
  {
    sprintf(letters, "%d", connection.connNumber);
    myDisplay.displayZoneText(DISP_ZONE_TRAM, letters, PA_LEFT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
    waitZoneForever();
    const auto minutes = connection.getMinutes();
    sprintf(letters, "%d", minutes);
    myDisplay.displayZoneText(DISP_ZONE_MINS, letters, PA_RIGHT, 0, 0, PA_NO_EFFECT, PA_NO_EFFECT);
    waitZoneForever();
    delay(5000);
    if(minutes == 0) {
      if(hasSyncByte()) {
        connection = readTram();
      }
      else {
        break;
      }
    }
  }
  Serial.write(SYNC_BYTE);
}
