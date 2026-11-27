// Don't Give Up, phase 0, day 1 (#13): from the crash to the first morning at the lodge.
// English is written first; story/hu has the same knots, stitches, variables, tags and choices.
// Source of every rule and writer: docs/narrative/story-bible.md.

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

// Beat 0. The fallback narration; the cutscene, when it exists, replaces these lines.
=== intro ===
Snow falls on a narrow road through the wood. A horse cart creaks along. # scene: wood_road # cutscene: intro_crash
A rock waits under the snow. The cart tips, and everything goes white.
Far off, between the trees, wolves howl. The carter freezes.
He unties the horse and rides away. The pack runs after him, and the howling fades.
Mira opens her eyes. Lili. Dani. She knows their names. She knows nothing else.
-> cart

// Beat 1. Choice P0-1.
=== cart ===
The cart lies on its side in the snow. The carter is gone, and so is the horse. # scene: cart_camp
Lili and Dani sit up beside her, snowy and blinking. Nobody is hurt.
The light is already turning blue.
Lili: "Mama? What do we do now?"
+ ["We stay with the cart. Someone will come."] -> stay
+ ["We find a roof before dark."] -> explore

= stay
~ camp = "cart"
Mira pulls the tarp over the tipped cart and makes a shelter underneath.
~ trunk = true
~ change(food, 2, 10)
In the trunk they find blankets, bread, a lantern and a jar of honey.
~ change(memory, 1, 5)
A luggage tag hangs from the handle. Lili reads it out: "Lark Hill."
Nobody knows what it means. Mira tucks it into her pocket anyway.
By lantern light she tells a story she makes up as she goes. Dani falls asleep in the middle.
~ change(warmth, -1, 10)
~ change(hope, -1, 10)
Nobody comes back. The night is long and cold.
Far away something howls once, then the wood is still. The children sleep through it.
In the morning they follow a footpath through the trees. # scene: wood_path
-> lodge

= explore
~ camp = "wood"
Mira takes Dani's hand.
Mira: "Lili, you have the sharpest eyes. You lead."
~ change(trust, 1, 10)
They follow a narrow footpath between the pines. # scene: wood_path
At dusk Lili stops and points. Above a door among the trees, a lark is carved in the wood.
Lili: "Mama, look! A house!"
~ change(hope, 2, 10)
A roof before dark. Dani cheers so loudly that the snow falls off a branch.
-> lodge

// Beat 2. Reads camp: midday (cart) or dusk (wood).
=== lodge ===
{ camp == "cart":
    At midday they reach a small lodge. A lark is carved over the door.
- else:
    The door creaks open in the last of the light.
}
Inside there is dust, a cold stove, a hole in the roof, a woodbox and a bench chest. # scene: cabin
An old map hangs on the wall: this lodge with a small lark, a path down the valley, and a big house about two hours' walk away.
The lettering on the map has faded. Nobody can read the name.
Mira checks the stove, the flue and the woodbox without thinking.
Mira: "My hands remember what I don't."
-> day.first

// Beat 3. Day 1: Explore has one pick (fire or patch), Stay has two, at least one of them a task.
// The pick count is the number of tunnel calls; no variable holds it.
=== day ===
= first
-> slot.menu(camp == "wood") ->
{ camp == "cart":
    -> slot.menu(mg_fire == "" and mg_patch == "") ->
}
-> dog_chance

// The slot menu and its tasks, as tunnels. Fire and patch are offered while their band is "";
// forage, loft and rest and play once each (visited or not).
=== slot ===
= menu(tasks_only)
{ costs_hint:
    Mira looks around. What next?
- else:
    -> costs_hint ->
}
+ {mg_fire == ""} [Light the stove] -> fire
+ {mg_patch == ""} [Patch the roof hole] -> patch
+ {not tasks_only} {not forage} [Forage in the wood] -> forage
+ {not tasks_only} {not loft} [Explore the loft] -> loft
+ {not tasks_only} {not rest_play} [Rest and play] -> rest_play

= costs_hint
Mira rolls up her sleeves. Where to begin? # tutorial: slot_costs
->->

// The lead-in writes nothing and reads well when shown again; the tag ends its last line.
= fire
Mira kneels by the cold stove.
The wood in the woodbox is dry. # minigame: fire
-> fire_band

= fire_band
{ mg_fire:
- "good":
    ~ change(warmth, 3, 10)
    ~ change(hope, 1, 10)
    The stove catches at once and purrs like a small, happy bear.
- "fair":
    ~ change(warmth, 2, 10)
    ~ change(trust, 1, 10)
    The fire holds, but only if someone feeds it.
    Lili: "I'll do it. You sit."
- "poor":
    ~ change(hope, 1, 10)
    Smoke fills the room. Mira comes out with a sooty face, and Lili laughs until she hiccups.
}
{ not band_hint:
    -> band_hint ->
}
->->

= patch
{ trunk:
    Mira takes the cart tarp and a hammer from the trunk.
- else:
    Mira gathers pine boughs and moss by the door.
}
She climbs up onto the roof. # minigame: patch
-> patch_band

= patch_band
{ mg_patch:
- "good":
    ~ change(warmth, 2, 10)
    ~ change(hope, 1, 10)
    The patch holds tight. Not a single snowflake gets in.
- "fair":
    ~ change(warmth, 1, 10)
    ~ change(trust, 1, 10)
    The patch sags a little. Mira and Lili hold it up together until it sets.
- "poor":
    ~ change(hope, 1, 10)
    The patch sags and drips. Dani names the drip Gerald.
}
{ not band_hint:
    -> band_hint ->
}
->->

= band_hint
Mira brushes off her hands. # tutorial: band_result
->->

= forage
Mira takes a basket out into the wood. # scene: wood_clearing
Rose hips glow red against the snow. Under an old stump, a squirrel has hidden a whole store of hazelnuts.
~ change(food, 2, 10)
Mira: "Sorry, squirrel. We'll leave you half."
She comes home with a full basket. # scene: cabin
->->

= loft
Lili climbs the ladder to the loft. # scene: cabin_loft # pov: lili
Dust dances in a stripe of light. Under it lies an old guest book.
The last entry is years old: a short thank-you to the lodge in a neat, old-fashioned hand, signed only with an A.
Lili reads it aloud: "Snow on the pines, a fire in the stove. Thank you, old lodge."
~ change(memory, 1, 5)
~ change(trust, 1, 10)
Lili: "Mama, I can read joined-up writing. Somebody made me copy whole pages of it. I can feel it in my fingers."
Mira: "Then we both have clever hands."
Lili climbs down with the book under her arm. # scene: cabin # pov: mira
->->

= rest_play
Dani: "Rest means play. Everybody knows that." # pov: dani
They build a snowman by the door. He gets a pine-cone nose and a very serious face.
~ change(hope, 2, 10)
Dani: "He's the lodge's grandpa. He keeps an eye on things."
They come in pink-cheeked, and the lodge feels a little less empty. # pov: mira
->->

// Beat 4. The first dog chance.
=== dog_chance ===
Before supper they fetch wood from the woodshed.
A thin dog watches from under the woodshed. One eye sits in a dark patch.
Dani: "Mama, can he have my crust? He's looking at it."
+ ["Give him your crust, Dani."] -> share
+ ["Keep your crust, Dani. We need our bread tonight."] -> refuse

= share
~ food_cost()
~ dog = "ours"
~ change(dog_care, 4, 10)
Mira: "Go on, then. Slowly, so he isn't scared."
The dog takes the crust as politely as a gentleman.
Dani: "He's got a patch, like a pirate. He's Patch!"
-> night

= refuse
~ change(hope, -1, 10)
Mira: "Not tonight, love. Let's see what we find first."
Dani: "Bye, dog. Don't go far."
The dog curls up under the woodshed, close enough to watch them.
Lili: "He's guarding us. We've got a night watchman, and he's free."
Dani giggles into his sleeve.
-> night

// Beat 5. The first cabin night: meal, children by hope, undone tasks, dog, night line by warmth.
=== night ===
Evening comes to the lodge. # tutorial: night_cost
{ food == 0:
    Supper is thin barley from the jar on the shelf. It fills them, just.
- else:
    They share supper on the bench chest, slowly, to make it last.
}
~ food_cost()
{ hope <= 2:
    The children eat without a word.
    Mira: "Tomorrow we make this place ours, one corner at a time."
    Lili leans on her shoulder. Dani holds on to her sleeve.
- else:
    Dani: "Tomorrow I'm counting every spider in this house."
    Lili: "Then you'll be up all week."
}
{ slot.forage and mg_patch == "" and not rose_hips:
    -> rose_hips ->
}
{ mg_patch == "":
    ~ change(warmth, -1, 10)
    The roof hole whistles all night. They sleep in their coats.
}
{ mg_fire == "":
    ~ change(warmth, -1, 10)
    The stove stays cold. Three noses, one blanket.
}
{ dog == "ours":
    Patch sleeps across the doorway, his nose on Dani's boot.
- else:
    Under the woodshed, the thin dog sighs in his sleep. Dani whispers goodnight to him.
}
{
- warmth <= 2:
    They sleep in one heap under every coat.
- warmth <= 5:
    The lodge creaks in the frost. Nobody's toes are warm, but nobody complains.
- else:
    Dani kicks off his blanket in his sleep. The lodge is warm.
}
~ change(cabin_days, 1, 4)
-> morning

= rose_hips
Lili: "Rose hips for supper, and a hole for a ceiling."
Mira: "We chose the rose hips. Tonight we pay for them in socks."
Dani: "I'm wearing four!"
->->

// The end of part a: one closing line (#34 continues the morning).
=== morning ===
Morning comes softly to the lodge. Outside, the snow lies blue and still.
-> END

// The only writer of numbers: clamps to 0..top. Self-contained (the AC 9 test compiles it alone).
=== function change(ref value, amount, top) ===
~ value = MAX(0, MIN(top, value + amount))

// The food cost rule: at food 0 the cost becomes hope -1 (the thin barley), and nobody goes without.
=== function food_cost() ===
{ food == 0:
    ~ change(hope, -1, 10)
- else:
    ~ change(food, -1, 10)
}
