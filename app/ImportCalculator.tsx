"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

// ================= PORTY USA =================
const PORTS = {
  NJ: { name: "Port Newark / NJ", lat: 40.6887, lon: -74.1482, ocean: 900 },
  GA: { name: "Port Savannah / GA", lat: 32.0835, lon: -81.0971, ocean: 900 },
  TX: { name: "Port Houston / TX", lat: 29.7323, lon: -95.262, ocean: 975 },
  LA: { name: "Port Los Angeles / CA", lat: 33.7326, lon: -118.2737, ocean: 1500 },
} as const;

type PortKey = keyof typeof PORTS;
type AuctionHouse = "copart" | "iaai" | "manheim";
type BuyerType = "private" | "company";
type VehicleSize = "sedan" | "suv" | "bigsuv" | "oversize";

type ExciseRate = 0.015 | 0.031 | 0.093 | 0.186;

// ================= MNOŻNIKI WIELKOŚCI AUTA =================
const SIZE_MULTIPLIERS: Record<VehicleSize, number> = {
  sedan: 1,
  suv: 1.2,
  bigsuv: 1.5,
  oversize: 2,
};

// Mnożnik transportu lądowego (różny od morskiego)
const INLAND_SIZE_MULTIPLIERS: Record<VehicleSize, number> = {
  sedan: 1,
  suv: 1.2,
  bigsuv: 1.5,
  oversize: 1.8,
};

// ================= PLACE (COPART / IAAI) =================
type Yard = {
  provider: AuctionHouse;
  state: string;
  city: string;
  label?: string;
  zip: string;
};

// (u Ciebie pusta lista — wkleisz sam)
const YARDS_USA: Yard[] = [
  // ===== COPART (USA) — z Twojej listy =====
  { provider: "copart", state: "AL", city: "BIRMINGHAM", label: "Standard", zip: "35023" },
  { provider: "copart", state: "AL", city: "DOTHAN", label: "Standard", zip: "36352" },
  { provider: "copart", state: "AL", city: "MOBILE", label: "Standard", zip: "36613" },
  { provider: "copart", state: "AL", city: "MOBILE SOUTH", label: "Standard", zip: "36582" },
  { provider: "copart", state: "AL", city: "MONTGOMERY", label: "Standard", zip: "36116" },
  { provider: "copart", state: "AL", city: "TANNER", label: "Standard", zip: "35671" },

  { provider: "copart", state: "AK", city: "ANCHORAGE", label: "Standard", zip: "99501" },

  { provider: "copart", state: "AZ", city: "PHOENIX", label: "Standard", zip: "85043" },
  { provider: "copart", state: "AZ", city: "PHOENIX NORTH", label: "Standard", zip: "85085" },
  { provider: "copart", state: "AZ", city: "TUCSON", label: "Standard", zip: "85706" },

  { provider: "copart", state: "AR", city: "FAYETTEVILLE", label: "Standard", zip: "72753" },
  { provider: "copart", state: "AR", city: "LITTLE ROCK", label: "Standard", zip: "72032" },

  { provider: "copart", state: "CA", city: "ADELANTO", label: "Standard", zip: "92301" },
  { provider: "copart", state: "CA", city: "ANTELOPE", label: "Standard", zip: "95843" },
  { provider: "copart", state: "CA", city: "BAKERSFIELD", label: "Standard", zip: "93307" },
  { provider: "copart", state: "CA", city: "FRESNO", label: "Standard", zip: "93725" },
  { provider: "copart", state: "CA", city: "HAYWARD", label: "Standard", zip: "94545" },
  { provider: "copart", state: "CA", city: "LONG BEACH", label: "Standard", zip: "90744" },
  { provider: "copart", state: "CA", city: "LOS ANGELES", label: "Standard", zip: "90001" },
  { provider: "copart", state: "CA", city: "MARTINEZ", label: "Standard", zip: "94553" },
  { provider: "copart", state: "CA", city: "MENTONE", label: "Standard", zip: "92359" },
  { provider: "copart", state: "CA", city: "NAPA", label: "Standard", zip: "94503" },
  { provider: "copart", state: "CA", city: "RANCHO CUCAMONGA", label: "Standard", zip: "91739" },
  { provider: "copart", state: "CA", city: "REDDING", label: "Standard", zip: "96007" },
  { provider: "copart", state: "CA", city: "SACRAMENTO", label: "Standard", zip: "95828" },
  { provider: "copart", state: "CA", city: "SAN BERNARDINO", label: "Standard", zip: "92324" },
  { provider: "copart", state: "CA", city: "SAN DIEGO", label: "Standard", zip: "92154" },
  { provider: "copart", state: "CA", city: "SAN JOSE", label: "Standard", zip: "95046" },
  { provider: "copart", state: "CA", city: "SO SACRAMENTO", label: "Standard", zip: "95828" },
  { provider: "copart", state: "CA", city: "SUN VALLEY", label: "Standard", zip: "91352" },
  { provider: "copart", state: "CA", city: "VALLEJO", label: "Standard", zip: "94590" },
  { provider: "copart", state: "CA", city: "VAN NUYS", label: "Standard", zip: "91405" },

  // ===== COPART (USA) — kolejna część =====
  { provider: "copart", state: "CO", city: "COLORADO SPRINGS", label: "Standard", zip: "80907" },
  { provider: "copart", state: "CO", city: "DENVER", label: "Standard", zip: "80603" },
  { provider: "copart", state: "CO", city: "DENVER CENTRAL", label: "Standard", zip: "80229" },
  { provider: "copart", state: "CO", city: "DENVER SOUTH", label: "Standard", zip: "80125" },

  { provider: "copart", state: "CT", city: "HARTFORD", label: "Standard", zip: "06051" },
  { provider: "copart", state: "CT", city: "HARTFORD SPRINGFIELD", label: "Standard", zip: "06026" },

  { provider: "copart", state: "DE", city: "SEAFORD", label: "Standard", zip: "19973" },

  { provider: "copart", state: "FL", city: "CLEWISTON", label: "Standard", zip: "33440" },
  { provider: "copart", state: "FL", city: "FT. PIERCE", label: "Standard", zip: "34946" },
  { provider: "copart", state: "FL", city: "JACKSONVILLE NORTH", label: "Standard", zip: "32218" },
  { provider: "copart", state: "FL", city: "MIAMI CENTRAL", label: "Standard", zip: "33167" },
  { provider: "copart", state: "FL", city: "MIAMI NORTH", label: "Standard", zip: "33054" },
  { provider: "copart", state: "FL", city: "MIAMI SOUTH", label: "Standard", zip: "33032" },
  { provider: "copart", state: "FL", city: "OCALA", label: "Standard", zip: "34482" },
  { provider: "copart", state: "FL", city: "ORLANDO NORTH", label: "Standard", zip: "32712" },
  { provider: "copart", state: "FL", city: "ORLANDO SOUTH", label: "Standard", zip: "32824" },
  { provider: "copart", state: "FL", city: "PUNTA GORDA", label: "Standard", zip: "34269" },
  { provider: "copart", state: "FL", city: "TALLAHASSEE", label: "Standard", zip: "32343" },
  { provider: "copart", state: "FL", city: "TAMPA SOUTH", label: "Standard", zip: "33578" },
  { provider: "copart", state: "FL", city: "WEST PALM BEACH", label: "Standard", zip: "33411" },

  { provider: "copart", state: "GA", city: "ATLANTA EAST", label: "Standard", zip: "30052" },
  { provider: "copart", state: "GA", city: "ATLANTA NORTH", label: "Standard", zip: "30507" },
  { provider: "copart", state: "GA", city: "ATLANTA SOUTH", label: "Standard", zip: "30294" },
  { provider: "copart", state: "GA", city: "ATLANTA WEST", label: "Standard", zip: "30168" },
  { provider: "copart", state: "GA", city: "AUGUSTA", label: "Standard", zip: "30906" },
  { provider: "copart", state: "GA", city: "CARTERSVILLE", label: "Standard", zip: "30120" },
  { provider: "copart", state: "GA", city: "MACON", label: "Standard", zip: "31008" },
  { provider: "copart", state: "GA", city: "FAIRBURN", label: "Standard", zip: "30213" },
  { provider: "copart", state: "GA", city: "SAVANNAH", label: "Standard", zip: "31405" },
  { provider: "copart", state: "GA", city: "TIFTON", label: "Standard", zip: "31794" },

  { provider: "copart", state: "HI", city: "HONOLULU", label: "Standard", zip: "96707" },

  { provider: "copart", state: "ID", city: "BOISE", label: "Standard", zip: "83687" },

  { provider: "copart", state: "IL", city: "CHICAGO NORTH", label: "Standard", zip: "60120" },
  { provider: "copart", state: "IL", city: "CHICAGO SOUTH", label: "Standard", zip: "60411" },
  { provider: "copart", state: "IL", city: "PEORIA", label: "Standard", zip: "61554" },
  { provider: "copart", state: "IL", city: "SOUTHERN ILLINOIS", label: "Standard", zip: "62205" },
  { provider: "copart", state: "IL", city: "WHEELING", label: "Standard", zip: "60090" },

  { provider: "copart", state: "IN", city: "CICERO", label: "Standard", zip: "46034" },
  { provider: "copart", state: "IN", city: "DYER", label: "Standard", zip: "46311" },
  { provider: "copart", state: "IN", city: "FORT WAYNE", label: "Standard", zip: "46803" },
  { provider: "copart", state: "IN", city: "INDIANAPOLIS", label: "Standard", zip: "46254" },

  { provider: "copart", state: "IA", city: "CEDAR RAPIDS", label: "Standard", zip: "52404" },
  { provider: "copart", state: "IA", city: "DAVENPORT", label: "Standard", zip: "52748" },
  { provider: "copart", state: "IA", city: "DES MOINES", label: "Standard", zip: "50317" },

  { provider: "copart", state: "KS", city: "KANSAS CITY", label: "Standard", zip: "66111" },

  { provider: "copart", state: "KY", city: "EARLINGTON", label: "Standard", zip: "42410" },
  { provider: "copart", state: "KY", city: "LEXINGTON EAST", label: "Standard", zip: "40509" },
  { provider: "copart", state: "KY", city: "LEXINGTON WEST", label: "Standard", zip: "40342" },
  { provider: "copart", state: "KY", city: "LOUISVILLE", label: "Standard", zip: "40272" },
  { provider: "copart", state: "KY", city: "WALTON", label: "Standard", zip: "41094" },

  // ===== COPART (USA) — kolejna część (3) =====
  { provider: "copart", state: "LA", city: "BATON ROUGE", label: "Standard", zip: "70739" },
  { provider: "copart", state: "LA", city: "NEW ORLEANS", label: "Standard", zip: "70129" },
  { provider: "copart", state: "LA", city: "SHREVEPORT", label: "Standard", zip: "71109" },

  { provider: "copart", state: "ME", city: "LYMAN", label: "Standard", zip: "04002" },
  { provider: "copart", state: "ME", city: "WINDHAM", label: "Standard", zip: "04062" },

  { provider: "copart", state: "DC", city: "WASHINGTON DC", label: "Standard", zip: "20602" },

  { provider: "copart", state: "MD", city: "BALTIMORE", label: "Standard", zip: "21048" },
  { provider: "copart", state: "MD", city: "BALTIMORE EAST", label: "Standard", zip: "21225" },
  { provider: "copart", state: "MD", city: "LAUREL", label: "Standard", zip: "20707" },

  { provider: "copart", state: "MA", city: "FREETOWN", label: "Standard", zip: "02702" },
  { provider: "copart", state: "MA", city: "NORTH BOSTON", label: "Standard", zip: "01862" },
  { provider: "copart", state: "MA", city: "SOUTH BOSTON", label: "Standard", zip: "01756" },
  { provider: "copart", state: "MA", city: "WEST WARREN", label: "Standard", zip: "01092" },

  { provider: "copart", state: "MI", city: "DETROIT", label: "Standard", zip: "48183" },
  { provider: "copart", state: "MI", city: "FLINT", label: "Standard", zip: "48423" },
  { provider: "copart", state: "MI", city: "IONIA", label: "Standard", zip: "48875" },
  { provider: "copart", state: "MI", city: "KINCHELOE", label: "Standard", zip: "49788" },
  { provider: "copart", state: "MI", city: "LANSING", label: "Standard", zip: "48917" },
  { provider: "copart", state: "MI", city: "WAYLAND", label: "Standard", zip: "49348" },

  { provider: "copart", state: "MN", city: "MINNEAPOLIS", label: "Standard", zip: "55434" },
  { provider: "copart", state: "MN", city: "MINNEAPOLIS NORTH", label: "Standard", zip: "55304" },
  { provider: "copart", state: "MN", city: "ST. CLOUD", label: "Standard", zip: "56310" },

  { provider: "copart", state: "KS", city: "WICHITA", label: "Standard", zip: "67216" },

  { provider: "copart", state: "MS", city: "GRENADA", label: "Standard", zip: "38901" },
  { provider: "copart", state: "MS", city: "JACKSON", label: "Standard", zip: "39073" },

  { provider: "copart", state: "MO", city: "COLUMBIA", label: "Standard", zip: "65201" },
  { provider: "copart", state: "MO", city: "SIKESTON", label: "Standard", zip: "63801" },
  { provider: "copart", state: "MO", city: "SPRINGFIELD", label: "Standard", zip: "65742" },
  { provider: "copart", state: "MO", city: "ST. LOUIS", label: "Standard", zip: "63044" },

  { provider: "copart", state: "MT", city: "BILLINGS", label: "Standard", zip: "59101" },
  { provider: "copart", state: "MT", city: "HELENA", label: "Standard", zip: "59601" },

  { provider: "copart", state: "NE", city: "LINCOLN", label: "Standard", zip: "68366" },

  { provider: "copart", state: "NV", city: "57 STORAGE", label: "Standard", zip: "89115" },
  { provider: "copart", state: "NV", city: "LAS VEGAS", label: "Standard", zip: "89115" },
  { provider: "copart", state: "NV", city: "LAS VEGAS WEST", label: "Standard", zip: "89032" },
  { provider: "copart", state: "NV", city: "RENO", label: "Standard", zip: "89506" },

  { provider: "copart", state: "NH", city: "CANDIA", label: "Standard", zip: "03034" },

  { provider: "copart", state: "NJ", city: "GLASSBORO EAST", label: "Standard", zip: "08028" },
  { provider: "copart", state: "NJ", city: "GLASSBORO WEST", label: "Standard", zip: "08028" },
  { provider: "copart", state: "NJ", city: "SOMERVILLE", label: "Standard", zip: "08844" },
  { provider: "copart", state: "NJ", city: "TRENTON", label: "Standard", zip: "08561" },

    // ===== COPART (USA) — kolejna część (4) =====
  { provider: "copart", state: "NM", city: "ALBUQUERQUE", label: "Standard", zip: "87105" },

  { provider: "copart", state: "NY", city: "ALBANY", label: "Standard", zip: "12205" },
  { provider: "copart", state: "NY", city: "BUFFALO", label: "Standard", zip: "14006" },
  { provider: "copart", state: "NY", city: "LONG ISLAND", label: "Standard", zip: "11719" },
  { provider: "copart", state: "NY", city: "NEWBURGH", label: "Standard", zip: "12542" },
  { provider: "copart", state: "NY", city: "ROCHESTER", label: "Standard", zip: "14482" },
  { provider: "copart", state: "NY", city: "SYRACUSE", label: "Standard", zip: "13036" },

  { provider: "copart", state: "NC", city: "CHINA GROVE", label: "Standard", zip: "28023" },
  { provider: "copart", state: "NC", city: "CONCORD", label: "Standard", zip: "28025" },
  { provider: "copart", state: "NC", city: "GASTONIA", label: "Standard", zip: "28052" },
  { provider: "copart", state: "NC", city: "LA GRANGE", label: "Standard", zip: "28551" },
  { provider: "copart", state: "NC", city: "LUMBERTON", label: "Standard", zip: "28360" },
  { provider: "copart", state: "NC", city: "MEBANE", label: "Standard", zip: "27302" },
  { provider: "copart", state: "NC", city: "MOCKSVILLE", label: "Standard", zip: "27028" },
  { provider: "copart", state: "NC", city: "RALEIGH NORTH", label: "Standard", zip: "27545" },
  { provider: "copart", state: "NC", city: "RALEIGH", label: "Standard", zip: "28334" },

  { provider: "copart", state: "ND", city: "BISMARCK", label: "Standard", zip: "58504" },

  { provider: "copart", state: "OH", city: "AKRON", label: "Standard", zip: "44203" },
  { provider: "copart", state: "OH", city: "CLEVELAND EAST", label: "Standard", zip: "44067" },
  { provider: "copart", state: "OH", city: "CLEVELAND WEST", label: "Standard", zip: "44028" },
  { provider: "copart", state: "OH", city: "COLUMBUS", label: "Standard", zip: "43207" },
  { provider: "copart", state: "OH", city: "DAYTON", label: "Standard", zip: "45439" },

  { provider: "copart", state: "OK", city: "OKLAHOMA CITY", label: "Standard", zip: "73129" },
  { provider: "copart", state: "OK", city: "TULSA", label: "Standard", zip: "74107" },

  { provider: "copart", state: "OR", city: "EUGENE", label: "Standard", zip: "97402" },
  { provider: "copart", state: "OR", city: "PORTLAND NORTH", label: "Standard", zip: "97218" },
  { provider: "copart", state: "OR", city: "PORTLAND SOUTH", label: "Standard", zip: "97071" },

  { provider: "copart", state: "PA", city: "ALTOONA", label: "Standard", zip: "15931" },
  { provider: "copart", state: "PA", city: "CHAMBERSBURG", label: "Standard", zip: "17202" },
  { provider: "copart", state: "PA", city: "HARRISBURG", label: "Standard", zip: "17028" },
  { provider: "copart", state: "PA", city: "PHILADELPHIA", label: "Standard", zip: "18073" },
  { provider: "copart", state: "PA", city: "PHILADELPHIA EAST-SUBLOT", label: "Standard", zip: "18914" },
  { provider: "copart", state: "PA", city: "PITTSBURGH NORTH", label: "Standard", zip: "16117" },
  { provider: "copart", state: "PA", city: "PITTSBURGH SOUTH", label: "Standard", zip: "15122" },
  { provider: "copart", state: "PA", city: "PITTSBURGH WEST", label: "Standard", zip: "15122" },
  { provider: "copart", state: "PA", city: "SCRANTON", label: "Standard", zip: "18642" },
  { provider: "copart", state: "PA", city: "YORK HAVEN", label: "Standard", zip: "17370" },

  { provider: "copart", state: "RI", city: "EXETER", label: "Standard", zip: "02822" },

  { provider: "copart", state: "SC", city: "COLUMBIA", label: "Standard", zip: "29053" },
  { provider: "copart", state: "SC", city: "NORTH CHARLESTON", label: "Standard", zip: "29448" },
  { provider: "copart", state: "SC", city: "SPARTANBURG", label: "Standard", zip: "29301" },

  { provider: "copart", state: "SD", city: "RAPID CITY", label: "Standard", zip: "57701" },

  { provider: "copart", state: "TN", city: "KNOXVILLE", label: "Standard", zip: "37354" },
  { provider: "copart", state: "TN", city: "MEMPHIS", label: "Standard", zip: "38118" },
  { provider: "copart", state: "TN", city: "NASHVILLE", label: "Standard", zip: "37090" },

    // ===== COPART (USA) — kolejna część (5) =====

  { provider: "copart", state: "TX", city: "ABILENE", label: "Standard", zip: "79601" },
  { provider: "copart", state: "TX", city: "AMARILLO", label: "Standard", zip: "79118" },
  { provider: "copart", state: "TX", city: "ANDREWS", label: "Standard", zip: "79714" },
  { provider: "copart", state: "TX", city: "AUSTIN", label: "Standard", zip: "78130" },
  { provider: "copart", state: "TX", city: "CORPUS CHRISTI", label: "Standard", zip: "78405" },
  { provider: "copart", state: "TX", city: "DALLAS", label: "Standard", zip: "75051" },
  { provider: "copart", state: "TX", city: "DALLAS SOUTH", label: "Standard", zip: "75172" },
  { provider: "copart", state: "TX", city: "EL PASO", label: "Standard", zip: "79821" },
  { provider: "copart", state: "TX", city: "FT. WORTH", label: "Standard", zip: "76052" },
  { provider: "copart", state: "TX", city: "HOUSTON", label: "Standard", zip: "77073" },
  { provider: "copart", state: "TX", city: "HOUSTON EAST", label: "Standard", zip: "77049" },
  { provider: "copart", state: "TX", city: "LONGVIEW", label: "Standard", zip: "75603" },
  { provider: "copart", state: "TX", city: "LUFKIN", label: "Standard", zip: "75904" },
  { provider: "copart", state: "TX", city: "MCALLEN", label: "Standard", zip: "78570" },
  { provider: "copart", state: "TX", city: "NORTH AUSTIN", label: "Standard", zip: "76574" },
  { provider: "copart", state: "TX", city: "SAN ANTONIO", label: "Standard", zip: "78224" },
  { provider: "copart", state: "TX", city: "WACO", label: "Standard", zip: "76501" },

  { provider: "copart", state: "UT", city: "OGDEN", label: "Standard", zip: "84404" },
  { provider: "copart", state: "UT", city: "SALT LAKE CITY", label: "Standard", zip: "84044" },

  { provider: "copart", state: "VT", city: "RUTLAND", label: "Standard", zip: "05736" },

  { provider: "copart", state: "VA", city: "DANVILLE", label: "Standard", zip: "24531" },
  { provider: "copart", state: "VA", city: "FREDERICKSBURG", label: "Standard", zip: "22408" },
  { provider: "copart", state: "VA", city: "HAMPTON", label: "Standard", zip: "23666" },
  { provider: "copart", state: "VA", city: "RICHMOND", label: "Standard", zip: "23150" },
  { provider: "copart", state: "VA", city: "RICHMOND EAST", label: "Standard", zip: "23030" },

  { provider: "copart", state: "WA", city: "GRAHAM", label: "Standard", zip: "98338" },
  { provider: "copart", state: "WA", city: "NORTH SEATTLE", label: "Standard", zip: "98223" },
  { provider: "copart", state: "WA", city: "PASCO", label: "Standard", zip: "99301" },
  { provider: "copart", state: "WA", city: "SPOKANE", label: "Standard", zip: "99001" },

  { provider: "copart", state: "WV", city: "CHARLESTON", label: "Standard", zip: "25526" },

  { provider: "copart", state: "WI", city: "APPLETON", label: "Standard", zip: "54914" },
  { provider: "copart", state: "WI", city: "MADISON SOUTH", label: "Standard", zip: "53558" },
  { provider: "copart", state: "WI", city: "MILWAUKEE NORTH", label: "Standard", zip: "53224" },
  { provider: "copart", state: "WI", city: "MILWAUKEE SOUTH", label: "Standard", zip: "53132" },

  { provider: "copart", state: "WY", city: "CASPER", label: "Standard", zip: "82601" },

  // ===== MANHEIM (USA) — z Twojej listy =====
  { provider: "manheim", state: "AL", city: "BIRMINGHAM", label: "Manheim", zip: "35217" },
  { provider: "manheim", state: "AL", city: "VALLEY", label: "4 Star Auto Auction Powered by Manheim", zip: "36854" },

  { provider: "manheim", state: "AZ", city: "PHOENIX", label: "Manheim", zip: "85353" },
  { provider: "manheim", state: "AZ", city: "TUCSON", label: "Manheim", zip: "85756" },

  { provider: "manheim", state: "AR", city: "CONWAY", label: "Manheim Little Rock", zip: "72032" },

  { provider: "manheim", state: "CA", city: "ANAHEIM", label: "Manheim California", zip: "92807" },
  { provider: "manheim", state: "CA", city: "FRESNO", label: "Manheim Fresno", zip: "93706" },
  { provider: "manheim", state: "CA", city: "OCEANSIDE", label: "Manheim Oceanside", zip: "92057" },
  { provider: "manheim", state: "CA", city: "RIVERSIDE", label: "Manheim Riverside", zip: "92504" },
  { provider: "manheim", state: "CA", city: "HAYWARD", label: "Manheim San Francisco Bay", zip: "94544" },
  { provider: "manheim", state: "CA", city: "FONTANA", label: "Manheim Southern California", zip: "92337" },

  { provider: "manheim", state: "CO", city: "AURORA", label: "Manheim Denver", zip: "80011" },

  { provider: "manheim", state: "FL", city: "ORLANDO", label: "Manheim Central Florida", zip: "32824" },
  { provider: "manheim", state: "FL", city: "DAYTONA BEACH", label: "Manheim Daytona Beach", zip: "32124" },
  { provider: "manheim", state: "FL", city: "DAVIE", label: "Manheim Fort Lauderdale", zip: "33314" },
  { provider: "manheim", state: "FL", city: "FORT MYERS", label: "Manheim Fort Myers", zip: "33916" },
  { provider: "manheim", state: "FL", city: "JACKSONVILLE", label: "Manheim Jacksonville", zip: "32219" },
  { provider: "manheim", state: "FL", city: "LAKELAND", label: "Manheim Lakeland", zip: "33809" },
  { provider: "manheim", state: "FL", city: "OCOEE", label: "Manheim Orlando", zip: "34761" },
  { provider: "manheim", state: "FL", city: "WEST PALM BEACH", label: "Manheim Palm Beach", zip: "33411" },
  { provider: "manheim", state: "FL", city: "PENSACOLA", label: "Manheim Pensacola", zip: "32505" },
  { provider: "manheim", state: "FL", city: "CLEARWATER", label: "Manheim St. Pete", zip: "33762" },
  { provider: "manheim", state: "FL", city: "TALLAHASSEE", label: "Manheim Tallahassee", zip: "32305" },
  { provider: "manheim", state: "FL", city: "TAMPA", label: "Manheim Tampa", zip: "33619" },

  { provider: "manheim", state: "GA", city: "COLLEGE PARK", label: "Manheim Atlanta", zip: "30349" },
  { provider: "manheim", state: "GA", city: "ATLANTA", label: "MyCentralAuction", zip: "30328" },
  { provider: "manheim", state: "GA", city: "ATLANTA", label: "Manheim Georgia", zip: "30331" },
  { provider: "manheim", state: "GA", city: "KINGSTON", label: "Rome Auto Auction Powered by Manheim", zip: "30145" },

  { provider: "manheim", state: "IL", city: "MATTESON", label: "Manheim Chicago", zip: "60443" },

  { provider: "manheim", state: "IN", city: "INDIANAPOLIS", label: "Manheim Indianapolis", zip: "46239" },
  { provider: "manheim", state: "IN", city: "CLARKSVILLE", label: "Manheim Louisville", zip: "47129" },

  { provider: "manheim", state: "IA", city: "STUART", label: "Manheim Iowa", zip: "50250" },

  { provider: "manheim", state: "KS", city: "OLATHE", label: "Olathe Mobile Auction", zip: "66061" },
  { provider: "manheim", state: "KS", city: "WICHITA", label: "Wichita Mobile Auction", zip: "67207" },

  { provider: "manheim", state: "LA", city: "SCOTT", label: "Manheim Lafayette", zip: "70583" },
  { provider: "manheim", state: "LA", city: "SLIDELL", label: "Manheim New Orleans", zip: "70460" },

  { provider: "manheim", state: "MD", city: "ELKRIDGE", label: "Manheim Baltimore-Washington", zip: "21075" },
  { provider: "manheim", state: "MD", city: "BELCAMP", label: "Manheim Maryland", zip: "21017" },

  { provider: "manheim", state: "MA", city: "NORTH DIGHTON", label: "Manheim New England", zip: "02764" },

  { provider: "manheim", state: "MI", city: "CARLETON", label: "Manheim Detroit", zip: "48117" },
  { provider: "manheim", state: "MI", city: "MT. MORRIS", label: "Manheim Flint", zip: "48458" },

  { provider: "manheim", state: "MN", city: "MAPLE GROVE", label: "Manheim Minneapolis", zip: "55369" },
  { provider: "manheim", state: "MN", city: "SHAKOPEE", label: "Manheim Northstar Minnesota", zip: "55379" },

  { provider: "manheim", state: "MS", city: "HATTIESBURG", label: "Manheim Mississippi", zip: "39402" },

  { provider: "manheim", state: "MO", city: "KANSAS CITY", label: "Manheim Kansas City", zip: "64161" },
  { provider: "manheim", state: "MO", city: "BRIDGETON", label: "Manheim St. Louis", zip: "63044" },

  { provider: "manheim", state: "NE", city: "OMAHA", label: "Manheim Omaha", zip: "68138" },

  { provider: "manheim", state: "NV", city: "LAS VEGAS", label: "Manheim Nevada", zip: "89165" },

  { provider: "manheim", state: "NH", city: "SOMERSWORTH", label: "Manheim New Hampshire", zip: "03878" },

  { provider: "manheim", state: "NJ", city: "BORDENTOWN", label: "Manheim New Jersey", zip: "08505" },
  { provider: "manheim", state: "NJ", city: "FAIRFIELD", label: "Manheim NY Metro Skyline", zip: "07004" },

  { provider: "manheim", state: "NM", city: "ALBUQUERQUE", label: "Manheim New Mexico", zip: "87105" },

  { provider: "manheim", state: "NY", city: "CLIFTON PARK", label: "Manheim Albany", zip: "12065" },
  { provider: "manheim", state: "NY", city: "NEWBURGH", label: "Manheim New York", zip: "12550" },
  { provider: "manheim", state: "NY", city: "ROCHESTER", label: "Manheim Rochester", zip: "14615" },

  { provider: "manheim", state: "NC", city: "CONCORD", label: "Manheim Charlotte", zip: "28027" },
  { provider: "manheim", state: "NC", city: "KENLY", label: "Manheim North Carolina", zip: "27542" },
  { provider: "manheim", state: "NC", city: "STATESVILLE", label: "Manheim Statesville", zip: "28625" },
  { provider: "manheim", state: "NC", city: "ROCKY POINT", label: "Manheim Wilmington", zip: "28457" },

  { provider: "manheim", state: "OH", city: "HAMILTON", label: "Manheim Cincinnati", zip: "45011" },
  { provider: "manheim", state: "OH", city: "BROOK PARK", label: "Manheim Cleveland", zip: "44142" },
  { provider: "manheim", state: "OH", city: "GROVE CITY", label: "Manheim Ohio", zip: "43123" },

  { provider: "manheim", state: "OK", city: "SAPULPA", label: "Manheim Tulsa", zip: "74066" },

  { provider: "manheim", state: "OR", city: "PORTLAND", label: "Manheim Portland", zip: "97217" },

  { provider: "manheim", state: "PA", city: "GRANTVILLE", label: "Manheim Keystone Pennsylvania", zip: "17028" },
  { provider: "manheim", state: "PA", city: "MANHEIM", label: "Manheim Pennsylvania", zip: "17545" },
  { provider: "manheim", state: "PA", city: "HATFIELD", label: "Manheim Philadelphia", zip: "19440" },
  { provider: "manheim", state: "PA", city: "CRANBERRY TOWNSHIP", label: "Manheim Pittsburgh", zip: "16066" },

  { provider: "manheim", state: "SC", city: "DARLINGTON", label: "Manheim Darlington", zip: "29532" },
  { provider: "manheim", state: "SC", city: "GREER", label: "Manheim Greer Service Center", zip: "29651" },

  { provider: "manheim", state: "TN", city: "MOUNT JULIET", label: "Manheim Nashville", zip: "37122" },

  { provider: "manheim", state: "TX", city: "DALLAS", label: "Manheim Dallas", zip: "75236" },
  { provider: "manheim", state: "TX", city: "EULESS", label: "Manheim Dallas-Fort Worth", zip: "76040" },
  { provider: "manheim", state: "TX", city: "EL PASO", label: "Manheim El Paso", zip: "79932" },
  { provider: "manheim", state: "TX", city: "HOUSTON", label: "Manheim Texas Hobby", zip: "77061" },
  { provider: "manheim", state: "TX", city: "HOUSTON", label: "Manheim Houston", zip: "77041" },
  { provider: "manheim", state: "TX", city: "PLANO", label: "Park Place Auto Auction Powered by Manheim", zip: "75093" },
  { provider: "manheim", state: "TX", city: "SAN ANTONIO", label: "Manheim San Antonio", zip: "78219" },

  { provider: "manheim", state: "UT", city: "WOODS CROSS", label: "Manheim Utah", zip: "84087" },

  { provider: "manheim", state: "VA", city: "FREDERICKSBURG", label: "Manheim Fredericksburg", zip: "22406" },
  { provider: "manheim", state: "VA", city: "HARRISONBURG", label: "Manheim Harrisonburg", zip: "22801" },

  { provider: "manheim", state: "WA", city: "KENT", label: "Manheim Seattle", zip: "98032" },

  { provider: "manheim", state: "WI", city: "CALEDONIA", label: "Manheim Milwaukee", zip: "53108" },

  // ===== IAAI (USA) — z Twojej listy =====
  { provider: "iaai", state: "TX", city: "ABILENE", zip: "79601" },
  { provider: "iaai", state: "CA", city: "ACE - CARSON", zip: "90248" },
  { provider: "iaai", state: "CA", city: "ACE - PERRIS", zip: "92571" },
  { provider: "iaai", state: "CA", city: "ACE - PERRIS 2", zip: "92571" },
  { provider: "iaai", state: "OH", city: "AKRON-CANTON", zip: "44663" },
  { provider: "iaai", state: "NY", city: "ALBANY", zip: "12303" },
  { provider: "iaai", state: "NM", city: "ALBUQUERQUE", zip: "87105" },
  { provider: "iaai", state: "PA", city: "ALTOONA", zip: "16637" },
  { provider: "iaai", state: "TX", city: "AMARILLO", zip: "79118" },
  { provider: "iaai", state: "CA", city: "ANAHEIM", zip: "92806" },
  { provider: "iaai", state: "CA", city: "ANAHEIM CONSOLIDATED", zip: "92806" },
  { provider: "iaai", state: "AK", city: "ANCHORAGE", zip: "99654" },
  { provider: "iaai", state: "WI", city: "APPLETON", zip: "54914" },
  { provider: "iaai", state: "NC", city: "ASHEVILLE", zip: "28732" },
  { provider: "iaai", state: "KY", city: "ASHLAND", zip: "41102" },
  { provider: "iaai", state: "GA", city: "ATLANTA", zip: "30052" },
  { provider: "iaai", state: "GA", city: "ATLANTA EAST", zip: "30680" },
  { provider: "iaai", state: "GA", city: "ATLANTA NORTH", zip: "30101" },
  { provider: "iaai", state: "GA", city: "ATLANTA SOUTH", zip: "30260" },
  { provider: "iaai", state: "GA", city: "ATLANTA WEST", zip: "30153" },
  { provider: "iaai", state: "TX", city: "AUSTIN", zip: "78616" },
  { provider: "iaai", state: "TX", city: "AUSTIN NORTH", zip: "76527" },
  { provider: "iaai", state: "NJ", city: "AVENEL NEW JERSEY", zip: "07001" },
  { provider: "iaai", state: "MD", city: "BALTIMORE", zip: "21226" },
  { provider: "iaai", state: "LA", city: "BATON ROUGE", zip: "70721" },
  { provider: "iaai", state: "MT", city: "BILLINGS", zip: "59101" },
  { provider: "iaai", state: "AL", city: "BIRMINGHAM", zip: "35022" },
  { provider: "iaai", state: "ID", city: "BOISE", zip: "83642" },
  { provider: "iaai", state: "MA", city: "BOSTON - SHIRLEY", zip: "01464" },
  { provider: "iaai", state: "KY", city: "BOWLING GREEN", zip: "42101" },
  { provider: "iaai", state: "PA", city: "BRIDGEPORT", zip: "19405" },
  { provider: "iaai", state: "WV", city: "BUCKHANNON", zip: "26201" },
  { provider: "iaai", state: "NY", city: "BUFFALO", zip: "14207" },
  { provider: "iaai", state: "VT", city: "BURLINGTON", zip: "05452" },
  { provider: "iaai", state: "WY", city: "CASPER", zip: "82601" },
  { provider: "iaai", state: "NJ", city: "CENTRAL NEW JERSEY", zip: "07751" },
  { provider: "iaai", state: "SC", city: "CHARLESTON", zip: "29470" },
  { provider: "iaai", state: "NC", city: "CHARLOTTE", zip: "28206" },
  { provider: "iaai", state: "TN", city: "CHATTANOOGA", zip: "37404" },
  { provider: "iaai", state: "IL", city: "CHICAGO-NORTH", zip: "60118" },
  { provider: "iaai", state: "IL", city: "CHICAGO-SOUTH", zip: "60428" },
  { provider: "iaai", state: "IL", city: "CHICAGO-WEST", zip: "60505" },
  { provider: "iaai", state: "OH", city: "CINCINNATI", zip: "45069" },
  { provider: "iaai", state: "OH", city: "CINCINNATI-SOUTH", zip: "45102" },
  { provider: "iaai", state: "FL", city: "CLEARWATER", zip: "33760" },
  { provider: "iaai", state: "OH", city: "CLEVELAND", zip: "44053" },
  { provider: "iaai", state: "CO", city: "COLORADO SPRINGS", zip: "80925" },
  { provider: "iaai", state: "OH", city: "COLUMBUS", zip: "43123" },
  { provider: "iaai", state: "NC", city: "CONCORD", zip: "28025" },
  { provider: "iaai", state: "TX", city: "CORPUS CHRISTI", zip: "78405" },
  { provider: "iaai", state: "VA", city: "CULPEPER", zip: "22701" },
  { provider: "iaai", state: "TX", city: "DALLAS", zip: "75172" },
  { provider: "iaai", state: "TX", city: "DALLAS/FT WORTH", zip: "75050" },
  { provider: "iaai", state: "IA", city: "DAVENPORT", zip: "52802" },
  { provider: "iaai", state: "OH", city: "DAYTON", zip: "45417" },
  { provider: "iaai", state: "CO", city: "DENVER EAST", zip: "80022" },
  { provider: "iaai", state: "IA", city: "DES MOINES", zip: "50069" },
  { provider: "iaai", state: "MI", city: "DETROIT", zip: "48111" },
  { provider: "iaai", state: "AL", city: "DOTHAN", zip: "36345" },
  { provider: "iaai", state: "IL", city: "DREAM RIDES", zip: "60154" },
  { provider: "iaai", state: "MD", city: "DUNDALK", zip: "21222" },
  { provider: "iaai", state: "CA", city: "EAST BAY", zip: "94565" },
  { provider: "iaai", state: "TX", city: "EL PASO", zip: "79938" },
  { provider: "iaai", state: "IL", city: "ELECTRIC VEHICLE AUCTIONS", zip: "60154" },
  { provider: "iaai", state: "MD", city: "ELKTON", zip: "21921" },
  { provider: "iaai", state: "NJ", city: "ENGLISHTOWN", zip: "07726" },
  { provider: "iaai", state: "PA", city: "ERIE", zip: "16416" },
  { provider: "iaai", state: "OR", city: "EUGENE", zip: "97402" },
  { provider: "iaai", state: "ND", city: "FARGO", zip: "58102" },
  { provider: "iaai", state: "AR", city: "FAYETTEVILLE", zip: "72744" },
  { provider: "iaai", state: "MI", city: "FLINT", zip: "48507" },
  { provider: "iaai", state: "CA", city: "FONTANA", zip: "92335" },
  { provider: "iaai", state: "FL", city: "FORT MYERS", zip: "33913" },
  { provider: "iaai", state: "FL", city: "FORT PIERCE", zip: "34981" },
  { provider: "iaai", state: "IN", city: "FORT WAYNE", zip: "46806" },
  { provider: "iaai", state: "TX", city: "FORT WORTH NORTH", zip: "76247" },
  { provider: "iaai", state: "CA", city: "FREMONT", zip: "94538" },
  { provider: "iaai", state: "CA", city: "FRESNO", zip: "93705" },
  { provider: "iaai", state: "IL", city: "GOV AUCTIONS MIDWEST", zip: "60154" },
  { provider: "iaai", state: "IL", city: "GOV AUCTIONS NORTHEAST", zip: "60154" },
  { provider: "iaai", state: "IL", city: "GOV AUCTIONS SOUTH", zip: "60154" },
  { provider: "iaai", state: "IL", city: "GOV AUCTIONS WEST", zip: "60154" },
  { provider: "iaai", state: "MI", city: "GRAND RAPIDS", zip: "49315" },
  { provider: "iaai", state: "NC", city: "GREENSBORO", zip: "27253" },
  { provider: "iaai", state: "SC", city: "GREENVILLE", zip: "29681" },
  { provider: "iaai", state: "MS", city: "GRENADA", zip: "38901" },
  { provider: "iaai", state: "MS", city: "GULF COAST", zip: "39562" },
  { provider: "iaai", state: "CT", city: "HARTFORD", zip: "06088" },
  { provider: "iaai", state: "CA", city: "HIGH DESERT", zip: "92345" },
  { provider: "iaai", state: "NC", city: "HIGH POINT", zip: "27263" },
  { provider: "iaai", state: "HI", city: "HONOLULU", zip: "96707" },
  { provider: "iaai", state: "TX", city: "HOUSTON", zip: "77038" },
  { provider: "iaai", state: "TX", city: "HOUSTON SOUTH", zip: "77583" },
  { provider: "iaai", state: "TX", city: "HOUSTON-NORTH", zip: "77032" },
  { provider: "iaai", state: "AL", city: "HUNTSVILLE", zip: "35613" },
  { provider: "iaai", state: "IN", city: "INDIANAPOLIS", zip: "46217" },
  { provider: "iaai", state: "IN", city: "INDIANAPOLIS SOUTH", zip: "47229" },
  { provider: "iaai", state: "MS", city: "JACKSON", zip: "39272" },
  { provider: "iaai", state: "FL", city: "JACKSONVILLE", zip: "32218" },
  { provider: "iaai", state: "KS", city: "KANSAS CITY", zip: "66111" },
  { provider: "iaai", state: "MO", city: "KANSAS CITY EAST", zip: "64076" },
  { provider: "iaai", state: "TN", city: "KNOXVILLE", zip: "37914" },
  { provider: "iaai", state: "LA", city: "LAFAYETTE", zip: "70583" },
  { provider: "iaai", state: "GA", city: "LAKE CITY", zip: "30260" },
  { provider: "iaai", state: "NV", city: "LAS VEGAS", zip: "89122" },
  { provider: "iaai", state: "SC", city: "LEXINGTON", zip: "29073" },
  { provider: "iaai", state: "IL", city: "LINCOLN", zip: "62656" },
  { provider: "iaai", state: "AR", city: "LITTLE ROCK", zip: "72142" },
  { provider: "iaai", state: "NY", city: "LONG ISLAND", zip: "11763" },
  { provider: "iaai", state: "TX", city: "LONGVIEW", zip: "75605" },
  { provider: "iaai", state: "CA", city: "LOS ANGELES", zip: "90248" },
  { provider: "iaai", state: "CA", city: "LOS ANGELES SOUTH", zip: "90744" },
  { provider: "iaai", state: "KY", city: "LOUISVILLE NORTH", zip: "40019" },
  { provider: "iaai", state: "TX", city: "LUBBOCK", zip: "79415" },
  { provider: "iaai", state: "GA", city: "MACON", zip: "31217" },
  { provider: "iaai", state: "NH", city: "MANCHESTER", zip: "03079" },
  { provider: "iaai", state: "TX", city: "MCALLEN", zip: "78537" },
  { provider: "iaai", state: "TN", city: "MEMPHIS", zip: "38053" },
  { provider: "iaai", state: "MD", city: "METRO DC", zip: "20613" },
  { provider: "iaai", state: "FL", city: "MIAMI-NORTH", zip: "33332" },
  { provider: "iaai", state: "WI", city: "MILWAUKEE", zip: "53089" },
  { provider: "iaai", state: "MN", city: "MINNEAPOLIS SOUTH", zip: "55065" },
  { provider: "iaai", state: "MN", city: "MINNEAPOLIS/ST. PAUL", zip: "55117" },
  { provider: "iaai", state: "MT", city: "MISSOULA", zip: "59808" },
  { provider: "iaai", state: "NY", city: "MONTICELLO", zip: "12701" },
  { provider: "iaai", state: "TN", city: "NASHVILLE", zip: "37218" },
  { provider: "iaai", state: "DE", city: "NEW CASTLE", zip: "19720" },
  { provider: "iaai", state: "LA", city: "NEW ORLEANS EAST", zip: "70126" },
  { provider: "iaai", state: "NY", city: "NEWBURGH", zip: "12575" },
  { provider: "iaai", state: "CA", city: "NORTH HOLLYWOOD", zip: "91605" },
  { provider: "iaai", state: "VA", city: "NORTHERN VIRGINIA", zip: "22406" },
  { provider: "iaai", state: "OK", city: "OKLAHOMA CITY", zip: "73121" },
  { provider: "iaai", state: "NE", city: "OMAHA", zip: "68059" },
  { provider: "iaai", state: "NE", city: "OMAHA SOUTH", zip: "68366" },
  { provider: "iaai", state: "ME", city: "ONLINE EXCLUSIVE", zip: "04927" },
  { provider: "iaai", state: "FL", city: "ORLANDO", zip: "32824" },
  { provider: "iaai", state: "FL", city: "ORLANDO-NORTH", zip: "32773" },
  { provider: "iaai", state: "KY", city: "PADUCAH", zip: "42003" },
  { provider: "iaai", state: "FL", city: "PENSACOLA", zip: "32583" },
  { provider: "iaai", state: "TX", city: "PERMIAN BASIN", zip: "79764" },
  { provider: "iaai", state: "PA", city: "PHILADELPHIA", zip: "19428" },
  { provider: "iaai", state: "AZ", city: "PHOENIX", zip: "85041" },
  { provider: "iaai", state: "PA", city: "PITTSBURGH", zip: "15001" },
  { provider: "iaai", state: "PA", city: "PITTSBURGH-NORTH", zip: "15044" },
  { provider: "iaai", state: "NJ", city: "PORT MURRAY", zip: "07865" },
  { provider: "iaai", state: "WI", city: "PORTAGE", zip: "53901" },
  { provider: "iaai", state: "OR", city: "PORTLAND", zip: "97230" },
  { provider: "iaai", state: "ME", city: "PORTLAND - GORHAM", zip: "04038" },
  { provider: "iaai", state: "OR", city: "PORTLAND SOUTH", zip: "97071" },
  { provider: "iaai", state: "OR", city: "PORTLAND WEST", zip: "97217" },
  { provider: "iaai", state: "RI", city: "PROVIDENCE", zip: "02915" },
  { provider: "iaai", state: "UT", city: "PROVO", zip: "84648" },
  { provider: "iaai", state: "VA", city: "PULASKI", zip: "24301" },
  { provider: "iaai", state: "NC", city: "RALEIGH", zip: "27520" },
  { provider: "iaai", state: "IL", city: "REC RIDES - ONLINE-EXCLUSIVE", zip: "60154" },
  { provider: "iaai", state: "NV", city: "RENO", zip: "89437" },
  { provider: "iaai", state: "VA", city: "RICHMOND", zip: "23005" },
  { provider: "iaai", state: "CA", city: "RIVERSIDE", zip: "92509" },
  { provider: "iaai", state: "VA", city: "ROANOKE", zip: "24122" },
  { provider: "iaai", state: "NY", city: "ROCHESTER", zip: "14416" },
  { provider: "iaai", state: "CA", city: "SACRAMENTO", zip: "95742" },
  { provider: "iaai", state: "CA", city: "SACRAMENTO WEST", zip: "95620" },
  { provider: "iaai", state: "UT", city: "SALT LAKE CITY", zip: "84401" },
  { provider: "iaai", state: "TX", city: "SAN ANTONIO-SOUTH", zip: "78224" },
  { provider: "iaai", state: "CA", city: "SAN DIEGO", zip: "92154" },
  { provider: "iaai", state: "CA", city: "SANTA CLARITA", zip: "91387" },
  { provider: "iaai", state: "GA", city: "SAVANNAH", zip: "31326" },
  { provider: "iaai", state: "NJ", city: "SAYREVILLE", zip: "08872" },
  { provider: "iaai", state: "PA", city: "SCRANTON", zip: "18640" },
  { provider: "iaai", state: "WA", city: "SEATTLE", zip: "98374" },
  { provider: "iaai", state: "WV", city: "SHADY SPRING", zip: "25918" },
  { provider: "iaai", state: "LA", city: "SHREVEPORT", zip: "71033" },
  { provider: "iaai", state: "SD", city: "SIOUX FALLS", zip: "57039" },
  { provider: "iaai", state: "IN", city: "SOUTH BEND", zip: "46619" },
  { provider: "iaai", state: "NJ", city: "SOUTHERN NEW JERSEY", zip: "08012" },
  { provider: "iaai", state: "IL", city: "SPECIALTY DIVISION", zip: "60173" },
  { provider: "iaai", state: "WA", city: "SPOKANE", zip: "99216" },
  { provider: "iaai", state: "MO", city: "SPRINGFIELD", zip: "65803" },
  { provider: "iaai", state: "MN", city: "ST. CLOUD", zip: "56367" },
  { provider: "iaai", state: "IL", city: "ST. LOUIS", zip: "62232" },
  { provider: "iaai", state: "NY", city: "STATEN ISLAND", zip: "10314" },
  { provider: "iaai", state: "CA", city: "STOCKTON", zip: "95205" },
  { provider: "iaai", state: "VA", city: "SUFFOLK", zip: "23434" },
  { provider: "iaai", state: "NY", city: "SYRACUSE", zip: "13039" },
  { provider: "iaai", state: "FL", city: "TAMPA", zip: "34221" },
  { provider: "iaai", state: "FL", city: "TAMPA NORTH", zip: "34667" },
  { provider: "iaai", state: "MA", city: "TAUNTON", zip: "02718" },
  { provider: "iaai", state: "MA", city: "TEMPLETON", zip: "01468" },
  { provider: "iaai", state: "VA", city: "TIDEWATER", zip: "23693" },
  { provider: "iaai", state: "GA", city: "TIFTON", zip: "31794" },
  { provider: "iaai", state: "AZ", city: "TUCSON", zip: "85714" },
  { provider: "iaai", state: "OK", city: "TULSA", zip: "74107" },
  { provider: "iaai", state: "ME", city: "VIRTUAL LANE A", zip: "04927" },
  { provider: "iaai", state: "ME", city: "VIRTUAL LANE B", zip: "04927" },
  { provider: "iaai", state: "ME", city: "VIRTUAL LANE C", zip: "04927" },
  { provider: "iaai", state: "FL", city: "WEST PALM BEACH", zip: "33478" },
  { provider: "iaai", state: "KS", city: "WICHITA", zip: "67219" },
  { provider: "iaai", state: "NC", city: "WILMINGTON", zip: "28429" },
  { provider: "iaai", state: "PA", city: "YORK SPRINGS", zip: "17372" },

  // ===== END IAAI =====
];
function isZipInAnyYard(zip: string) {
  const z = (zip || "").trim().slice(0, 5);
  if (z.length !== 5) return false;
  return YARDS_USA.some((y) => y.zip === z);
}
// NOTE: Nie używamy \p{...} (Unicode Property Escapes), bo w części środowisk (np. pewne bundlery/wykonania)
// może to rzucać błędem typu "Invalid regular expression".
function normalize(s: string) {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function yardDisplay(y: Yard) {
  const lbl = y.label ? ` (${y.label})` : "";
  return `${y.state} - ${y.city}${lbl}`;
}

function searchYards(query: string, provider: AuctionHouse, limit = 12) {
  const q = normalize(query);
  if (!q) return [] as Yard[];
  function isZipInAnyYard(zip: string) {
  const z = (zip || "").trim().slice(0, 5);
  if (z.length !== 5) return false;
  return YARDS_USA.some((y) => y.zip === z);
}


  const byProvider = YARDS_USA.filter((y) => y.provider === provider);
  const starts: Yard[] = [];
  const contains: Yard[] = [];

  for (const y of byProvider) {
    const hay = normalize(`${y.state} ${y.city} ${y.zip} ${yardDisplay(y)}`);
    const city = normalize(y.city);
    const st = normalize(y.state);
    const zip = normalize(y.zip);

    if (city.startsWith(q) || st.startsWith(q) || zip.startsWith(q) || hay.startsWith(q)) {
      starts.push(y);
    } else if (hay.includes(q)) {
      contains.push(y);
    }
  }

  return [...starts, ...contains].slice(0, limit);
}

// ================= STAŁE KOSZTOWE =================
const AUCTION_MIN_FEE = 580;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function calcAuctionRate(priceUSD: number) {
  const p = priceUSD;
  if (p <= 1000) return 0;
  if (p <= 2000) return 0.345;
  if (p <= 3000) return 0.295;
  if (p <= 4000) return 0.245;
  if (p <= 5000) return 0.195;

  if (p <= 10000) {
    const t = clamp01((p - 5000) / (10000 - 5000));
    return lerp(0.195, 0.127, t);
  }
  if (p <= 15000) {
    const t = clamp01((p - 10000) / (15000 - 10000));
    return lerp(0.127, 0.107, t);
  }
  if (p <= 20000) {
    const t = clamp01((p - 15000) / (20000 - 15000));
    return lerp(0.107, 0.088, t);
  }
  if (p <= 40000) {
    const t = clamp01((p - 20000) / (40000 - 20000));
    return lerp(0.088, 0.08, t);
  }
  return 0.08;
}

function calcAuctionFee(priceUSD: number) {
  if (priceUSD <= 1000) return AUCTION_MIN_FEE + 120;
  const rate = calcAuctionRate(priceUSD);
  return Math.max(priceUSD * rate, AUCTION_MIN_FEE) + 120;
}

const INLAND_RATE = 2.3; // 2,3$ za milę
const INLAND_MIN = 400; // minimum 400$
const INLAND_MAX = 2000; // maksimum 2000$

const INSURANCE_RATE = 0.02;
const INSURANCE_MIN = 400;

const CUSTOMS_AGENCY_EUR = 500;
const POLAND_FIXED_PLN = 2800;
const COMPANY_COMMISSION_PLN = 3300;

function n2(x: number) {
  const v = Number.isFinite(x) ? x : 0;
  return v.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseNum(v: unknown) {
  if (!v) return 0;
  const cleaned = String(v).replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocodeZipUS(zip: string) {
  const z = zip?.trim();
  if (!z) return null;

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=` +
    encodeURIComponent(z);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = Number(data[0].lat);
  const lon = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon } as { lat: number; lon: number };
}

async function fetchNBPRate(code: string) {
  try {
    const res = await fetch(`https://api.nbp.pl/api/exchangerates/rates/A/${code}/?format=json`);
    const data = await res.json();
    return data.rates[0].mid as number;
  } catch {
    return null;
  }
}

function usdToEur(usd: number, usdPln: number, eurPln: number) {
  if (!(usdPln > 0) || !(eurPln > 0)) return 0;
  return (usd * usdPln) / eurPln;
}

// ================= ROZBICIE "DODATKOWE WYDATKI" (WERSJA KLIENTA) =================
// 1) Suma udziałów musi dawać 1.00
// 2) Część kwoty "wchłaniamy" w: Cena z prowizją, Transport lądowy, Transport morski
const CLIENT_EXTRA_SPLIT = {
  absorbedIntoAuctionBundle: 0.2, // idzie do "Cena z prowizją domu aukcyjnego"
  absorbedIntoInland: 0.2, // idzie do "Transport lądowy"
  absorbedIntoOcean: 0.2, // idzie do "Transport morski"

  brokerFee: 0.15, // Opłata brokerska
  safeLoading: 0.1, // Bezpieczny załadunek
  unloading: 0.1, // Bezpieczny rozładunek
  securingMaterials: 0.1, // Materiały zabezpieczające
  usaService: 0.15, // Obsługa USA
} as const;

function round2(x: number) {
  return Math.round((Number.isFinite(x) ? x : 0) * 100) / 100;
}

function splitExtraUSD(extraUSD: number) {
  const e = Math.max(0, extraUSD);

  // surowe
  const raw = {
    absorbedAuction: e * CLIENT_EXTRA_SPLIT.absorbedIntoAuctionBundle,
    absorbedInland: e * CLIENT_EXTRA_SPLIT.absorbedIntoInland,
    absorbedOcean: e * CLIENT_EXTRA_SPLIT.absorbedIntoOcean,
    brokerFee: e * CLIENT_EXTRA_SPLIT.brokerFee,
    safeLoading: e * CLIENT_EXTRA_SPLIT.safeLoading,
    unloading: e * CLIENT_EXTRA_SPLIT.unloading,
    securingMaterials: e * CLIENT_EXTRA_SPLIT.securingMaterials,
    usaService: e * CLIENT_EXTRA_SPLIT.usaService,
  };

  // zaokrąglamy do 0.01 i pilnujemy, żeby suma była IDEALNIE równa extraUSD
  const keys = Object.keys(raw) as (keyof typeof raw)[];
  const out: Record<keyof typeof raw, number> = {} as any;

  let sum = 0;
  for (const k of keys) {
    out[k] = round2(raw[k]);
    sum += out[k];
  }

  // korekta różnicy na ostatniej pozycji (żeby nie pływało przez zaokrąglenia)
  const diff = round2(e - sum);
  const lastKey = keys[keys.length - 1];
  out[lastKey] = round2(out[lastKey] + diff);

  return out;
}

// ================= COMPONENT =================
const SECRET = "USAImportAuto";

export default function Page() {
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("app_unlocked");
      if (saved === "true") setUnlocked(true);
    } catch {
      // ignore
    }
  }, []);

  if (!mounted) return null;

  if (!unlocked) {
    return (
      <PasswordScreen
        onUnlock={() => {
          try {
            localStorage.setItem("app_unlocked", "true");
          } catch {
            // ignore
          }
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <MainApp
      onLogout={() => {
        try {
          localStorage.removeItem("app_unlocked");
        } catch {
          // ignore
        }
        setUnlocked(false);
      }}
    />
  );
}

function PasswordScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const isComposing = useRef(false);

  function normalizePass(value: string) {
    return value.replace(/ /g, " ").trim();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = normalizePass(password);
    if (cleaned === SECRET) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="text-2xl font-bold tracking-tight">Dostęp chroniony</div>
          <p className="mt-1 text-sm text-gray-600">Wpisz hasło, aby uruchomić kalkulator.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="app-password" className="mb-1 block text-sm font-semibold text-gray-600">
                Hasło
              </label>

              <div className="relative">
                <input
                  id="app-password"
                  name="app_unlock"
                  type={show ? "text" : "password"}
                  inputMode="text"
                  autoComplete="current-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-xl border p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-black"
                  value={password}
                  onCompositionStart={() => (isComposing.current = true)}
                  onCompositionEnd={(e) => {
                    isComposing.current = false;
                    setPassword((e.target as HTMLInputElement).value);
                    setError(false);
                  }}
                  onChange={(e) => {
                    if (isComposing.current) return;
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  onPaste={(e) => {
                    requestAnimationFrame(() => {
                      setPassword((e.target as HTMLInputElement).value);
                      setError(false);
                    });
                  }}
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  {show ? "Ukryj" : "Pokaż"}
                </button>
              </div>

              {error && <p className="mt-2 text-sm text-red-600">Nieprawidłowe hasło.</p>}
            </div>

            <button type="submit" className="w-full rounded-xl bg-black py-3 text-white transition hover:opacity-90 font-semibold">
              Wejdź
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

type TabKey = "calculator" | "client";

function MainApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>("calculator");

  const [buyerType, setBuyerType] = useState<BuyerType>("private");
  const [exciseRate, setExciseRate] = useState<ExciseRate>(0.031);
  const [exciseGrossPln, setExciseGrossPln] = useState("0");
  const [auctionHouse, setAuctionHouse] = useState<AuctionHouse>("copart");
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>("sedan");

  const [yardQuery, setYardQuery] = useState("");
  const [selectedYard, setSelectedYard] = useState<Yard | null>(null);
  const [zip, setZip] = useState("");

  const [yardOpen, setYardOpen] = useState(false);
  const yardWrapRef = useRef<HTMLDivElement | null>(null);

  const [vehiclePrice, setVehiclePrice] = useState("10000");
  const [extraCosts, setExtraCosts] = useState("0");
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);

  const [usdPln, setUsdPln] = useState<number | null>(null);
  const [eurPln, setEurPln] = useState<number | null>(null);

  const [zipCoord, setZipCoord] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [u, e] = await Promise.all([fetchNBPRate("USD"), fetchNBPRate("EUR")]);
      setUsdPln(u);
      setEurPln(e);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    const z = zip.trim();

    if (z.length < 3) {
      setZipCoord(null);
      return;
    }

    const t = window.setTimeout(async () => {
      const c = await geocodeZipUS(z);
      if (alive) setZipCoord(c);
    }, 350);

    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [zip]);

  const suggestions = useMemo(() => searchYards(yardQuery, auctionHouse, 12), [yardQuery, auctionHouse]);

  useEffect(() => {
    if (!yardOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = yardWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setYardOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setYardOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [yardOpen]);

  useEffect(() => {
    setSelectedYard(null);
    setYardQuery("");
    setZip("");
    setYardOpen(false);
  }, [auctionHouse]);

  const calc = useMemo(() => {
    const priceUSD = parseNum(vehiclePrice);
    const extraUSD = parseNum(extraCosts);

    let bestPort: PortKey = "NJ";
    let bestMiles = Number.POSITIVE_INFINITY;

    if (zipCoord) {
      for (const k of Object.keys(PORTS) as PortKey[]) {
        const p = PORTS[k];
        const miles = haversineMiles(zipCoord.lat, zipCoord.lon, p.lat, p.lon);
        if (miles < bestMiles) {
          bestMiles = miles;
          bestPort = k;
        }
      }
    }

    const port = PORTS[bestPort];
    const sizeOceanMult = SIZE_MULTIPLIERS[vehicleSize];
    const sizeInlandMult = INLAND_SIZE_MULTIPLIERS[vehicleSize];

   const zipKnown = isZipInAnyYard(zip);
const inlandMinDynamic = zipKnown ? INLAND_MIN : 1000;

const baseInland = zipCoord ? bestMiles * INLAND_RATE : inlandMinDynamic;
const inlandPreClamp = Math.max(baseInland, inlandMinDynamic) * sizeInlandMult;
const inland = Math.min(inlandPreClamp, INLAND_MAX);


    const oceanPreClamp = port.ocean * sizeOceanMult;
    const ocean = Math.min(oceanPreClamp, 2750);
    const auctionFee = calcAuctionFee(priceUSD);
    const insurance = insuranceEnabled ? Math.max(priceUSD * INSURANCE_RATE, INSURANCE_MIN) : 0;

    const usaTotalUSD = priceUSD + auctionFee + inland + ocean + insurance + extraUSD;

    const usdPlnSafe = usdPln ?? 0;
    const eurPlnSafe = eurPln ?? 0;

    const isCompanyLike = buyerType === "company" || priceUSD < 3000;

    let dutyEUR = 0;
    let vatEUR = 0;

    if (isCompanyLike) {
      const transportUSD = inland + ocean;
      const customsValueUSD = priceUSD + transportUSD;
      const dutyBaseUSD = customsValueUSD + insurance;

      const dutyBaseEUR = usdToEur(dutyBaseUSD, usdPlnSafe, eurPlnSafe);
      dutyEUR = Math.max(dutyBaseEUR * 0.1, 300);

      const vatBaseEUR = usdToEur(customsValueUSD, usdPlnSafe, eurPlnSafe) + dutyEUR;
      vatEUR = Math.max(vatBaseEUR * 0.21, 300);
    } else {
      const baseEUR = usdToEur(priceUSD * 0.6, usdPlnSafe, eurPlnSafe);
      dutyEUR = Math.max(baseEUR * 0.1, 300);
      vatEUR = Math.max((baseEUR + dutyEUR) * 0.21, 300);
    }

    const rotterdamTotalEUR = dutyEUR + vatEUR + CUSTOMS_AGENCY_EUR;

    const usaTotalPLN = usdPlnSafe > 0 ? usaTotalUSD * usdPlnSafe : 0;
    const rotterdamTotalPLN = eurPlnSafe > 0 ? rotterdamTotalEUR * eurPlnSafe : 0;

    const totalPLN = usaTotalPLN + rotterdamTotalPLN + POLAND_FIXED_PLN + COMPANY_COMMISSION_PLN;

    const exciseGross = parseNum(exciseGrossPln);
    const exciseNet = exciseGross > 0 ? exciseGross / 1.23 : 0;
    const exciseVatPl = exciseGross > 0 ? exciseGross - exciseNet : 0;
    const exciseAmount = Math.max(0, exciseNet * exciseRate);

    const depositMinPLN = 3300;

    const penaltyRateMap: Record<AuctionHouse, number> = {
      copart: 0.1,
      iaai: 0.15,
      manheim: 0.3,
    };

    const penaltyRate = penaltyRateMap[auctionHouse];

    const requiredDepositUSD = Math.max(0, priceUSD * penaltyRate);
    const requiredDepositPLN =
      usdPlnSafe > 0 ? Math.max(depositMinPLN, requiredDepositUSD * usdPlnSafe) : depositMinPLN;

    const depositPLN = depositMinPLN;
    const depositUSD = usdPlnSafe > 0 ? depositPLN / usdPlnSafe : 0;

    const maxBidUSD = penaltyRate > 0 ? depositUSD / penaltyRate : 0;

    // ====== rozbicie extra (klient) ======
    const extraBreak = splitExtraUSD(extraUSD);
    const displayAuctionBundleUSD = priceUSD + auctionFee + extraBreak.absorbedAuction;
    const displayInlandUSD = inland + extraBreak.absorbedInland;
    const displayOceanUSD = ocean + extraBreak.absorbedOcean;

    // kontrolnie: suma musi zostać taka sama
    const clientUsaSumUSD =
      displayAuctionBundleUSD +
      displayInlandUSD +
      displayOceanUSD +
      insurance +
      extraBreak.brokerFee +
      extraBreak.safeLoading +
      extraBreak.unloading +
      extraBreak.securingMaterials +
      extraBreak.usaService;

    return {
      portName: port.name,

      // bazowe (kalkulator)
      auctionFee,
      inland,
      ocean,
      insurance,
      usaTotalUSD,

      // klient (rozbicie)
      extraUSD,
      extraBreak,
      displayAuctionBundleUSD,
      displayInlandUSD,
      displayOceanUSD,
      clientUsaSumUSD,

      // reszta bez zmian
      dutyEUR,
      vatEUR,
      rotterdamTotalEUR,
      totalPLN,
      exciseRate,
      exciseGross,
      exciseVatPl,
      exciseAmount,
      depositUSD,
      penaltyRate,
      maxBidUSD,
      requiredDepositUSD,
      requiredDepositPLN,
    };
  }, [
    buyerType,
    vehiclePrice,
    extraCosts,
    insuranceEnabled,
    vehicleSize,
    zipCoord,
    usdPln,
    eurPln,
    exciseRate,
    exciseGrossPln,
    auctionHouse,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-10 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              onClick={onLogout}
              className="ml-auto text-xs rounded-lg border px-3 py-2 hover:bg-slate-50"
              title="Wyloguj"
            >
              Wyloguj
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Kalkulator Importu USA → Rotterdam → Polska</h1>
              <div className="text-sm text-gray-500 mt-1">
                Kursy NBP: USD {usdPln ? n2(usdPln) : "..."} PLN · EUR {eurPln ? n2(eurPln) : "..."} PLN
              </div>
            </div>
          </div>

          {/* ====== TABS (2 zakładki na górze) ====== */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("calculator")}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                tab === "calculator" ? "bg-black text-white border-black" : "bg-white hover:bg-slate-50"
              }`}
            >
              Kalkulator
            </button>
            <button
              type="button"
              onClick={() => setTab("client")}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                tab === "client" ? "bg-black text-white border-black" : "bg-white hover:bg-slate-50"
              }`}
            >
              Rozliczenie pod dom
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Rodzaj klienta</label>
              <select
                className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value as BuyerType)}
              >
                <option value="private">Osoba prywatna</option>
                <option value="company">Firma</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Dom aukcyjny</label>
              <select
                className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
                value={auctionHouse}
                onChange={(e) => setAuctionHouse(e.target.value as AuctionHouse)}
              >
                <option value="copart">Copart</option>
                <option value="iaai">IAAI</option>
                <option value="manheim">Manheim</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Wielkość auta</label>
            <select
              className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
              value={vehicleSize}
              onChange={(e) => setVehicleSize(e.target.value as VehicleSize)}
            >
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="bigsuv">Big SUV</option>
              <option value="oversize">Oversize</option>
            </select>
          </div>

          <div className="relative" ref={yardWrapRef}>
            <label className="text-sm font-semibold text-gray-600">Plac (USA)</label>
            <input
              className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
              value={yardQuery}
              onFocus={() => {
                if (yardQuery.trim().length > 0) setYardOpen(true);
              }}
              onChange={(e) => {
                const v = e.target.value;
                setYardQuery(v);
                setSelectedYard(null);

                const maybeZip = v.replace(/[^0-9]/g, "").slice(0, 5);
                if (maybeZip.length === 5) {
                  setZip(maybeZip);
                }

                setYardOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") setYardOpen(true);
              }}
              placeholder="Wpisz miasto / stan / ZIP"
            />

            {yardOpen && yardQuery.trim().length > 0 && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((y) => (
                  <button
                    key={y.provider + y.zip + y.state + y.city}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                    onClick={() => {
                      setSelectedYard(y);
                      setYardQuery(yardDisplay(y));
                      setZip(y.zip);
                      setYardOpen(false);
                    }}
                  >
                    <span className="text-sm font-medium">{yardDisplay(y)}</span>
                    <span className="text-xs text-gray-500">{y.zip}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedYard && (
              <div className="text-xs text-gray-500 mt-2">
                Wybrano: {yardDisplay(selectedYard)} · ZIP {selectedYard.zip}
              </div>
            )}

            {yardOpen && (
              <button
                type="button"
                className="absolute right-2 top-8 text-[11px] px-2 py-1 rounded-lg border bg-white hover:bg-slate-50"
                onClick={() => setYardOpen(false)}
              >
                Zamknij
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">ZIP</label>
              <input
                className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Cena zakupu (USD)</label>
              <input
                className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
                value={vehiclePrice}
                onChange={(e) => setVehiclePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" checked={insuranceEnabled} onChange={(e) => setInsuranceEnabled(e.target.checked)} />
            <span className="text-sm">Ubezpieczenie transportu</span>
          </div>

          {/* ====== RÓŻNICA MIĘDZY ZAKŁADKAMI: INPUT "Dodatkowe wydatki" tylko w Kalkulatorze ====== */}
          {tab === "calculator" && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Dodatkowe wydatki (USD)</label>
              <input
                className="mt-1 w-full rounded-xl border p-2 focus:ring-2 focus:ring-black"
                value={extraCosts}
                onChange={(e) => setExtraCosts(e.target.value)}
              />
            </div>
          )}

          <div className="pt-2">
            <div className="text-sm font-semibold text-gray-700">Akcyza (PL)</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                className="rounded-xl border p-2 focus:ring-2 focus:ring-black"
                value={String(exciseRate)}
                onChange={(e) => setExciseRate(Number(e.target.value) as ExciseRate)}
              >
                <option value={0.015}>1,5%</option>
                <option value={0.031}>3,1%</option>
                <option value={0.093}>9,3%</option>
                <option value={0.186}>18,6%</option>
              </select>

              <input
                className="rounded-xl border p-2 focus:ring-2 focus:ring-black"
                placeholder="Wartość (PLN brutto)"
                value={exciseGrossPln}
                onChange={(e) => setExciseGrossPln(e.target.value)}
              />

              <div className="rounded-xl border p-2 bg-slate-50 flex items-center justify-between">
                <span className="text-sm text-gray-600">Akcyza</span>
                <span className="text-sm font-semibold">{n2(calc.exciseAmount)} PLN</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">VAT PL (23%) od tej wartości: {n2(calc.exciseVatPl)} PLN</div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border">
            <div className="text-sm font-semibold text-gray-700">Wymagany depozyt</div>

            <div className="mt-4 space-y-2 text-sm text-gray-800">
              <div>
                Kara umowna ({(calc.penaltyRate * 100).toFixed(0)}%): {n2(calc.requiredDepositUSD)} USD
              </div>

              <div className="text-base font-semibold">Do wpłaty: {n2(calc.requiredDepositPLN)} PLN</div>

              <div className="text-xs text-gray-500">Minimalny depozyt: 3300 PLN</div>
            </div>
          </div>
        </div>

        {/* ====== PANEL PO PRAWEJ (jak na screenie) ====== */}
        <div className="bg-black text-white rounded-2xl shadow-xl p-8 space-y-6 sticky top-10 h-fit">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400">Najbliższy port</div>
            <div className="text-lg font-semibold">{calc.portName}</div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="text-xs uppercase text-gray-400">USA (USD)</div>

            {/* ====== ZAKŁADKA: KALKULATOR ====== */}
            {tab === "calculator" && (
              <div className="space-y-1 text-sm">
                <div>Cena z prowizją domu aukcyjnego: {n2(parseNum(vehiclePrice) + calc.auctionFee)}</div>
                <div>Transport lądowy: {n2(calc.inland)}</div>
                <div>Transport morski: {n2(calc.ocean)}</div>
                <div>Ubezpieczenie: {n2(calc.insurance)}</div>
                <div>Dodatkowe koszty: {n2(parseNum(extraCosts))}</div>
                <div className="font-semibold">Razem: {n2(calc.usaTotalUSD)}</div>
              </div>
            )}

            {/* ====== ZAKŁADKA: ROZLICZENIE DLA KLIENTA ====== */}
            {tab === "client" && (
              <div className="space-y-1 text-sm">
                <div>Cena z prowizją domu aukcyjnego: {n2(calc.displayAuctionBundleUSD)}</div>
                <div>Transport lądowy: {n2(calc.displayInlandUSD)}</div>
                <div>Transport morski: {n2(calc.displayOceanUSD)}</div>
                <div>Ubezpieczenie: {n2(calc.insurance)}</div>

                <div className="pt-2"></div>

                <div>Opłata brokerska: {n2(calc.extraBreak.brokerFee)}</div>
                <div>Bezpieczny załadunek: {n2(calc.extraBreak.safeLoading)}</div>
                <div>Rozładunek: {n2(calc.extraBreak.unloading)}</div>
                <div>Materiały zabezpieczające: {n2(calc.extraBreak.securingMaterials)}</div>
                <div>Obsługa USA: {n2(calc.extraBreak.usaService)}</div>

                <div className="font-semibold">Razem: {n2(calc.clientUsaSumUSD)}</div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="text-xs uppercase text-gray-400">Rotterdam (EUR)</div>
            <div className="space-y-1 text-sm">
              <div>Cło: {n2(calc.dutyEUR)}</div>
              <div>VAT: {n2(calc.vatEUR)}</div>
              <div>Agencja celna: {n2(CUSTOMS_AGENCY_EUR)}</div>
              <div className="font-semibold">Razem: {n2(calc.rotterdamTotalEUR)}</div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="text-xs uppercase text-gray-400">Polska (PLN)</div>
            <div className="space-y-1 text-sm">
              <div>Transport: {n2(POLAND_FIXED_PLN)}</div>
              <div>Prowizja: {n2(COMPANY_COMMISSION_PLN)}</div>
            </div>
          </div>

          <div className="mt-6 -mx-8 bg-black text-white rounded-2xl p-8 shadow-xl">
            <div className="text-gray-400 text-sm">Łączny koszt</div>
            <div className="text-3xl font-bold tracking-tight mt-2">{n2(calc.totalPLN)} PLN</div>
          </div>

          <div className="mt-6 -mx-8 bg-black text-white rounded-2xl p-8 shadow-xl">
            <div className="text-xs uppercase tracking-wider text-gray-400">Depozyt 3300 PLN</div>
            <div className="mt-4 space-y-1 text-sm">
              <div>Depozyt w USD: {n2(calc.depositUSD)}</div>
              <div>
                Kara umowna ({(calc.penaltyRate * 100).toFixed(0)}%): {n2(calc.maxBidUSD * calc.penaltyRate)}
              </div>
              <div className="text-lg font-semibold mt-2">Maks. licytacja: {n2(calc.maxBidUSD)} USD</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 text-center text-[11px] text-gray-500">
        To narzędzie ma charakter wyłącznie poglądowy i służy jedynie do celów zabawy. Wyliczenia mogą różnić się od
        rzeczywistych kosztów.
      </div>
    </div>
  );
}