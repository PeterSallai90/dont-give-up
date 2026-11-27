// Don't Give Up, 0. fázis, 1. nap (#13): a balesettől az első reggelig a vadászlakban.
// A story/en angol szövegének teljes magyar változata: ugyanazok a knotok, stitchek, változók,
// tagek és választások. Minden szabály és író forrása: docs/narrative/story-bible.md.

VAR warmth = 3
VAR food = 1
VAR hope = 2
VAR trust = 5
VAR memory = 0
VAR camp = ""
VAR trunk = false
VAR cabin_days = 0
VAR dog = "none"
VAR dog_care = 0
VAR mg_fire = ""
VAR mg_patch = ""

-> intro

// 0. ütem. A tartalék narráció; ha elkészül az animáció, az váltja ki ezeket a sorokat.
=== intro ===
Hó hull a keskeny erdei útra. Egy lovas szekér nyikorog előre. # scene: wood_road # cutscene: intro_crash
A hó alatt egy szikla lapul. A szekér felborul, és minden elfehéredik.
Messze, a fák között farkasok üvöltenek. A kocsis megdermed.
Kifogja a lovat, és elvágtat. A falka utána iramodik, az üvöltés elhalkul.
Mira kinyitja a szemét. Lili. Dani. Tudja a nevüket. Mást semmit.
-> cart

// 1. ütem. A P0-1 választás.
=== cart ===
A szekér az oldalán fekszik a hóban. A kocsis eltűnt, és vele a ló is. # scene: cart_camp
Lili és Dani felülnek mellette, csupa hó mindkettő, és pislognak. Senkinek sem esett baja.
A fény már kékbe fordul.
Lili: „Anya? Most mi lesz?”
+ [„A szekérnél maradunk. Valaki majd jön.”] -> stay
+ [„Sötétedés előtt fedelet keresünk.”] -> explore

= stay
~ camp = "cart"
Mira ráhúzza a ponyvát a felborult szekérre, és menedéket rak össze alatta.
~ trunk = true
~ change(food, 2, 10)
Az utazóládában takarókat, kenyeret, egy lámpást és egy üveg mézet találnak.
~ change(memory, 1, 5)
A fogantyún csomagcímke lóg. Lili felolvassa: „Pacsirtadomb.”
Senki sem tudja, mit jelent. Mira azért zsebre teszi.
A lámpás fényénél mesélni kezd, és menet közben találja ki a mesét. Dani a közepén elalszik.
~ change(warmth, -1, 10)
~ change(hope, -1, 10)
Nem jön vissza senki. Hosszú és hideg az éjszaka.
Messze valami egyszer felvonít, aztán újra csend van az erdőben. A gyerekek átalusszák.
Reggel egy ösvényen indulnak el a fák között. # scene: wood_path
-> lodge

= explore
~ camp = "wood"
Mira kézen fogja Danit.
Mira: „Lili, neked van a legjobb szemed. Te mutatod az utat.”
~ change(trust, 1, 10)
Keskeny ösvényen indulnak el a fenyők között. # scene: wood_path
Alkonyatkor Lili megáll, és előremutat. A fák között egy ajtó fölé pacsirtát faragtak.
Lili: „Anya, nézd! Egy ház!”
~ change(hope, 2, 10)
Fedél sötétedés előtt. Dani akkorát ujjong, hogy lehull a hó egy ágról.
-> lodge

// 2. ütem. A camp értéke szerint délben (cart) vagy alkonyatkor (wood) érkeznek.
=== lodge ===
{ camp == "cart":
    Délre egy kis vadászlakhoz érnek. Az ajtó fölé pacsirtát faragtak.
- else:
    Az utolsó fénynél nyikorogva kinyílik az ajtó.
}
Bent por, hideg kályha, egy lyuk a tetőn, egy fásláda és egy padláda. # scene: cabin
A falon régi térkép lóg: rajta ez a vadászlak egy kis pacsirtával, egy völgybe vezető ösvény és egy nagy ház, nagyjából kétórányi járásra.
A térképen kifakult a felirat. A nevet senki sem tudja kiolvasni.
Mira gondolkodás nélkül megnézi a kályhát, a kéményt és a fásládát.
Mira: „A kezem emlékszik arra, amire én nem.”
-> day.first

// 3. ütem. Az 1. nap: Explore után egy választás (tűz vagy folt), Stay után kettő, legalább az egyik feladat.
// A választások számát a tunnelhívások száma adja; változó nem tárolja.
=== day ===
= first
-> slot.menu(camp == "wood") ->
{ camp == "cart":
    -> slot.menu(mg_fire == "" and mg_patch == "") ->
}
-> dog_chance

// A napi menü és a feladatai tunnelként. A tűz és a folt addig szerepel, amíg a sávja "";
// a gyűjtögetés, a padlás és a pihenés egyszer-egyszer (meglátogatva vagy sem).
=== slot ===
= menu(tasks_only)
{ costs_hint:
    Mira körülnéz. Mi legyen a következő?
- else:
    -> costs_hint ->
}
+ {mg_fire == ""} [A kályha begyújtása] -> fire
+ {mg_patch == ""} [A tetőlyuk befoltozása] -> patch
+ {not tasks_only} {not forage} [Gyűjtögetés az erdőben] -> forage
+ {not tasks_only} {not loft} [A padlás felfedezése] -> loft
+ {not tasks_only} {not rest_play} [Pihenés és játék] -> rest_play

= costs_hint
Mira feltűri az ingujját. Hol kezdje? # tutorial: slot_costs
->->

// A felvezetés semmit sem ír, és újra megjelenítve is természetes; a tag az utolsó sor végén áll.
= fire
Mira letérdel a hideg kályha elé.
A fásládában száraz a fa. # minigame: fire
-> fire_band

= fire_band
{ mg_fire:
- "good":
    ~ change(warmth, 3, 10)
    ~ change(hope, 1, 10)
    A kályha azonnal lángra kap, és úgy dorombol, mint egy kis, elégedett medve.
- "fair":
    ~ change(warmth, 2, 10)
    ~ change(trust, 1, 10)
    A tűz kitart, de csak ha valaki eteti.
    Lili: „Majd én. Te ülj le.”
- "poor":
    ~ change(hope, 1, 10)
    Füst tölti meg a szobát. Mira kormos arccal bukkan elő, Lili pedig addig nevet, amíg csuklani nem kezd.
}
{ not band_hint:
    -> band_hint ->
}
->->

= patch
{ trunk:
    Mira előveszi az utazóládából a szekérponyvát és egy kalapácsot.
- else:
    Mira fenyőágat és mohát gyűjt az ajtó előtt.
}
Felmászik a tetőre. # minigame: patch
-> patch_band

= patch_band
{ mg_patch:
- "good":
    ~ change(warmth, 2, 10)
    ~ change(hope, 1, 10)
    A folt szorosan tart. Egyetlen hópehely sem jut be.
- "fair":
    ~ change(warmth, 1, 10)
    ~ change(trust, 1, 10)
    A folt kicsit megereszkedik. Mira és Lili együtt tartják, amíg meg nem köt.
- "poor":
    ~ change(hope, 1, 10)
    A folt megereszkedik és csöpög. Dani elnevezi a csöpögést Gézának.
}
{ not band_hint:
    -> band_hint ->
}
->->

= band_hint
Mira leporolja a kezét. # tutorial: band_result
->->

= forage
Mira kosarat vesz a karjára, és kimegy az erdőbe. # scene: wood_clearing
Pirosan világít a csipkebogyó a hóban. Egy öreg tönk alatt egy mókus egész mogyorókincset rejtett el.
~ change(food, 2, 10)
Mira: „Bocs, mókus. A felét itt hagyjuk neked.”
Tele kosárral ér haza. # scene: cabin
->->

= loft
Lili felmászik a létrán a padlásra. # scene: cabin_loft # pov: lili
Egy fénycsíkban por táncol. Alatta egy régi vendégkönyv hever.
Az utolsó bejegyzés évekkel ezelőtti: rövid köszönet a vadászlaknak, gondos, régimódi kézírással, alatta csak egy Á betű.
Lili hangosan felolvassa: „Hó a fenyőkön, tűz a kályhában. Köszönöm, öreg vadászlak.”
~ change(memory, 1, 5)
~ change(trust, 1, 10)
Lili: „Anya, el tudom olvasni a folyóírást. Valaki egész oldalakat másoltatott le velem. Érzem az ujjaimban.”
Mira: „Akkor mindkettőnknek ügyes a keze.”
Lili a hóna alatt a könyvvel mászik le. # scene: cabin # pov: mira
->->

= rest_play
Dani: „A pihenés azt jelenti, hogy játszunk. Ezt mindenki tudja.” # pov: dani
Hóembert építenek az ajtó mellé. Tobozorrot kap és nagyon komoly arcot.
~ change(hope, 2, 10)
Dani: „Ő a vadászlak nagypapája. Ő vigyáz mindenre.”
Kipirult arccal jönnek be, és a vadászlak már nem tűnik olyan üresnek. # pov: mira
->->

// 4. ütem. Az első esély a kutyára.
=== dog_chance ===
Vacsora előtt fát hoznak a fáskamrából.
Egy sovány kutya figyel a fáskamra alól. Az egyik szeme egy sötét foltban ül.
Dani: „Anya, megkaphatja a kenyérhéjamat? Nagyon nézi.”
+ [„Add oda neki a kenyérhéjadat, Dani.”] -> share
+ [„Tartsd meg a kenyérhéjadat, Dani. Ma este nekünk is kell a kenyér.”] -> refuse

= share
~ food_cost()
~ dog = "ours"
~ change(dog_care, 4, 10)
Mira: „Jól van. Csak lassan, hogy meg ne ijedjen.”
A kutya olyan udvariasan veszi el a kenyérhéjat, mint egy úriember.
Dani: „Folt van a szemén, mint egy kalóznak. Ő lesz Foltos!”
-> night

= refuse
~ change(hope, -1, 10)
Mira: „Ma este még nem, kicsim. Előbb nézzük meg, mit találunk.”
Dani: „Szia, kutya. Ne menj messzire.”
A kutya összegömbölyödik a fáskamra alatt, épp olyan közel, hogy lássa őket.
Lili: „Vigyáz ránk. Lett egy éjjeliőrünk, ráadásul ingyen.”
Dani a ruhaujjába kuncog.
-> night

// 5. ütem. Az első éjszaka a vadászlakban: vacsora, a gyerekek a hope szerint, a kimaradt
// feladatok, a kutya, és az éjszaka sora a warmth szerint.
=== night ===
Beesteledik a vadászlakban. # tutorial: night_cost
{ food == 0:
    Vacsorára híg árpakása a polcon álló bödönből. Épp hogy jóllaknak.
- else:
    A padládán osztják el a vacsorát, lassan, hogy tovább tartson.
}
~ food_cost()
{ hope <= 2:
    A gyerekek szó nélkül esznek.
    Mira: „Holnap belakjuk ezt a helyet, sarokról sarokra.”
    Lili a vállára hajtja a fejét. Dani a ruhaujjába kapaszkodik.
- else:
    Dani: „Holnap megszámolom az összes pókot a házban.”
    Lili: „Akkor egész héten fent leszel.”
}
{ slot.forage and mg_patch == "" and not rose_hips:
    -> rose_hips ->
}
{ mg_patch == "":
    ~ change(warmth, -1, 10)
    A lyuk a tetőn egész éjjel fütyül. Kabátban alszanak.
}
{ mg_fire == "":
    ~ change(warmth, -1, 10)
    A kályha hideg marad. Három orr, egy takaró.
}
{ dog == "ours":
    Foltos keresztben alszik az ajtó előtt, orrát Dani csizmáján pihenteti.
- else:
    A fáskamra alatt nagyot sóhajt álmában a sovány kutya. Dani jó éjszakát suttog neki.
}
{
- warmth <= 2:
    Egy kupacban alszanak, minden kabát alatt.
- warmth <= 5:
    A vadászlak recseg a fagyban. Senkinek sem meleg a lábujja, de senki sem panaszkodik.
- else:
    Dani álmában lerúgja a takarót. Meleg van a vadászlakban.
}
~ change(cabin_days, 1, 4)
-> morning

= rose_hips
Lili: „Csipkebogyó vacsorára, a plafon helyén meg egy lyuk.”
Mira: „A csipkebogyót választottuk. Ma éjjel zokniban fizetünk érte.”
Dani: „Rajtam négy van!”
->->

// Az a) rész vége: egyetlen záró sor (a #34 folytatja a reggelt).
=== morning ===
Csendesen virrad a vadászlakban. Odakint kéken, mozdulatlanul fekszik a hó.
-> END

// A számok egyetlen írója: 0 és top közé szorít. Önálló (az AC 9 teszt külön fordítja).
=== function change(ref value, amount, top) ===
~ value = MAX(0, MIN(top, value + amount))

// Az étel ára: ha a food 0, a költség hope -1 lesz (a híg árpakása), és senki sem marad éhen.
=== function food_cost() ===
{ food == 0:
    ~ change(hope, -1, 10)
- else:
    ~ change(food, -1, 10)
}
