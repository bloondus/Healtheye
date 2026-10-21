/* ============================================================================
   HEALTHEYE — assets.local.js  (LOKALE KOPIE ANLEGEN, NIEMALS COMMITTEN!)
   ============================================================================
   Was ist das?
     Eure interne System-Liste für das „🎯 BETRIFFT UNS"-Badge im KEV-Panel.
     Jede KEV-Schwachstelle wird gegen diese Begriffe gematcht
     (vendor + product + vulnerabilityName, Kleinschreibung, Teilstring).

   So gehst du vor:
     1. Diese Datei kopieren:        cp assets.local.example.js assets.local.js
     2. Liste unten an eure echte Infrastruktur anpassen
     3. Fertig — assets.local.js steht in .gitignore und landet NIE im Repo.

   Warum nicht direkt ins Repo?
     Die Liste verrät euren Tech-Stack. Im öffentlichen Repo wäre das ein
     Informationsleck für Angreifer. Darum: lokal halten.
   ========================================================================== */

// ↓ Beispielwerte — ANPASSEN an eure Umgebung (alles kleingeschrieben)
window.HEALTHEYE_ASSETS = [
  // Betriebssysteme / Plattformen
  'windows', 'windows server', 'linux', 'active directory', 'exchange', 'sharepoint',
  // Virtualisierung / Netzwerk / Security-Appliances
  'vmware', 'esxi', 'vcenter', 'fortinet', 'fortios', 'cisco', 'palo alto',
  'citrix', 'veeam', 'sonicwall', 'ivanti', 'f5', 'pulse secure',
  // Spital-/Medizin-Systeme & Hersteller (eure echten Systeme eintragen!)
  'philips', 'siemens healthineers', 'ge healthcare', 'dräger', 'draeger',
  'medtronic', 'fresenius', 'imprivata', 'epic', 'cerner', 'dedalus', 'agfa',
];
