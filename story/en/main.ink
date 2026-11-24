// Placeholder story that proves the pipeline. The narrative-designer replaces it.
VAR warmth = 2
VAR hope = 1

-> night_one

=== night_one ===
The wind finds every gap in the old walls. Mira pulls the children closer.
* [Burn the broken chair] -> burn_chair
* [Search the cellar for blankets] -> cellar

=== burn_chair ===
~ warmth = warmth + 2
The fire crackles. For tonight, it is enough.
-> morning

=== cellar ===
~ hope = hope + 1
Under the dust there is a trunk, and in the trunk a quilt someone loved.
-> morning

=== morning ===
{ warmth > 2: The children slept through the night. | Nobody slept much, but they are together. }
-> END
