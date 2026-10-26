# Desks

A desk is a set of keys that share one first funder. This note is the rule that cut the list down to the root mainnet will use.

The first funder is the earliest ordinary ETH payment to that key, at or before the snapshot block. The lookup was the first page of those transfers, fifty rows. An internal payment older than that page was not seen. That key was treated as a singleton.

A key whose funder is a known exchange, bridge, or router, or who has no such payment, is a singleton. Singletons stay. Desks of fewer than 10 stay.

Farm-ish means at least 10 keys and a majority of those first payments inside one 24-hour window. Those desks are off the list.

One 453-key factory did not trip that one-day rule. Its busiest day was 20 keys across 853 days. It was removed because it was named. Its funder never walked a hall, so the funder was not added.

A parent funder is added only when that parent walked a qualifying hall in the same year and is not nonce 0. A factory that never walked is not added.

These counts are the list after the Verse clones were included. `script/Mainnet.s.sol` passes this root. Mainnet is not deployed. The full count, and the path from the earlier 21,501 keys, is in `snapshot/SNAPSHOT.md`.

- keys before: 21501
- farm-ish clusters before: 0
- clusters before: 17378
- keys only on LondonTokenBase clones: 3746
- previous-root keys removed: 11
- parents added: 0
- keys after: 25236
- clusters after: 19975
- farm-ish clusters after: 0
- root: `0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3`

Leaf: `keccak256(bytes.concat(keccak256(abi.encode(address))))`.
