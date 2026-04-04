VIVIM Sovereign Data Blockchain — Mathematical Architecture
Complete Cryptographic & Economic Specification for Human-Owned AI Memory
0. Design Thesis
Every human accumulates a unique corpus of AI interactions — questions asked, problems solved, preferences expressed, knowledge synthesized — scattered across OpenAI, Anthropic, Google, local models, IDE copilots, and every provider yet to exist. This corpus is the richest digital representation of a human mind ever created, and it is currently held hostage by the platforms that facilitated each conversation.

This document defines the complete mathematical architecture for a cryptographic system where:

All AI conversations from all providers are unified into a single, user-owned database
Ownership is enforced by mathematics, not terms of service
The user — and only the user — decides what to sell, to whom, and under what terms
Buyers can verify data properties without seeing the data
Privacy guarantees are provable, composable, and bounded
Consent is an immutable, auditable, revocable on-chain object
1. Foundational Primitives
1.1 Notation
Symbol	Meaning
λ
λ	Security parameter (e.g., 256 bits)
H
:
{
0
,
1
}
∗
→
{
0
,
1
}
λ
H:{0,1} 
∗
 →{0,1} 
λ
 	Collision-resistant hash (BLAKE3)
G
G	Elliptic curve group (Curve25519 or BLS12-381)
g
g	Generator of 
G
G
negl
(
λ
)
negl(λ)	Negligible function in 
λ
λ
[
n
]
[n]	The set 
{
1
,
2
,
…
,
n
}
{1,2,…,n}
U
U	Universe of all users
P
P	Universe of all AI providers
B
B	Universe of all buyers
1.2 Cryptographic Building Blocks
Required primitives, each instantiated with concrete schemes:

Primitive	Instantiation	Purpose
Digital Signatures	Ed25519	Ownership proofs, consent signing
Symmetric Encryption	AES-256-GCM	Per-ACU data encryption
Public-Key Encryption	X25519 + XSalsa20-Poly1305 (NaCl box)	Key encapsulation for sharing
Hash Function	BLAKE3	Merkle trees, commitments, identifiers
Merkle DAG	Custom over BLAKE3	Data integrity, inclusion proofs
ZK-SNARKs	Groth16 / PLONK over BLS12-381	Selective disclosure, data property proofs
Proxy Re-Encryption	AFGH scheme (Ateniese-Fu-Green-Hohenberger)	Revocable delegated decryption
Verifiable Random Function	ECVRF (RFC 9381)	Validator selection
Commitment Scheme	Pedersen over 
G
G	Hidden-value commitments
Secret Sharing	Shamir 
(
t
,
n
)
(t,n)-threshold	Key recovery, multi-device
2. Identity Layer
2.1 Sovereign Identity Generation
Each user 
u
u generates a master key pair from entropy:

seed
u
←
$
{
0
,
1
}
256
seed 
u
​
  
$
​
 {0,1} 
256
 

s
k
u
=
KDF
(
seed
u
,
"vivim-master-key"
)
sk 
u
​
 =KDF(seed 
u
​
 ,"vivim-master-key")

p
k
u
=
g
s
k
u
∈
G
pk 
u
​
 =g 
sk 
u
​
 
 ∈G

The VIVIM Decentralized Identifier (DID):

DID
u
=
did:vivim:
∥
Base58
(
H
(
p
k
u
)
)
DID 
u
​
 =did:vivim:∥Base58(H(pk 
u
​
 ))

This DID is the universal anchor for all of a user's data, consent records, and marketplace activity. It is self-certifying: knowing the DID lets you verify any signature from that user.

2.2 Hierarchical Deterministic Key Derivation
From the master seed, a tree of purpose-specific keys is derived (BIP-32 style):

text

seed_u
├── m/0'  → Signing key (Ed25519) — for on-chain transactions
├── m/1'  → Encryption key (X25519) — for data encryption
├── m/2'  → Provider-specific keys
│   ├── m/2'/0' → OpenAI import signing key
│   ├── m/2'/1' → Claude import signing key
│   ├── m/2'/2' → Gemini import signing key
│   └── m/2'/p' → Provider p import signing key
├── m/3'  → Device-specific keys
│   ├── m/3'/0' → Device 0 session key
│   └── m/3'/d' → Device d session key
└── m/4'  → Recovery keys (Shamir shares)
Derivation function:

s
k
u
,
path
=
HMAC-SHA512
(
s
k
parent
,
path_index
∥
0x00
)
left 256 bits
sk 
u,path
​
 =HMAC-SHA512(sk 
parent
​
 ,path_index∥0x00) 
left 256 bits
​
 

2.3 Multi-Device Key Sharing via Shamir Secret Sharing
The master seed is split into 
n
n shares with threshold 
t
t:

seed
u
=
ShamirSplit
(
t
,
n
,
seed
u
)
→
(
s
1
,
s
2
,
…
,
s
n
)
seed 
u
​
 =ShamirSplit(t,n,seed 
u
​
 )→(s 
1
​
 ,s 
2
​
 ,…,s 
n
​
 )

Any 
t
t shares reconstruct the seed:

seed
u
=
ShamirRecombine
(
s
i
1
,
s
i
2
,
…
,
s
i
t
)
seed 
u
​
 =ShamirRecombine(s 
i 
1
​
 
​
 ,s 
i 
2
​
 
​
 ,…,s 
i 
t
​
 
​
 )

Distribution: one share per device, one in encrypted cloud backup, one printed as recovery phrase.

2.4 Identity Attestation
A user can optionally link their DID to verifiable credentials (VCs) without revealing personal information:

VC
=
Sign
(
s
k
issuer
,
⟨
DID
u
,
claim
,
expiry
⟩
)
VC=Sign(sk 
issuer
​
 ,⟨DID 
u
​
 ,claim,expiry⟩)

ZK proof of credential without revealing identity:

π
vc
=
ZKProve
(
witness
:
(
VC
,
s
k
u
)
,
 statement
:
"holder of DID
u
 has valid credential of type 
T
"
)
π 
vc
​
 =ZKProve(witness:(VC,sk 
u
​
 ), statement:"holder of DID 
u
​
  has valid credential of type T")

3. Data Layer — The Addressable Context Unit (ACU)
3.1 ACU Formal Definition
An Addressable Context Unit (ACU) is the atomic unit of AI memory. Formally:

a
=
(
id
,
body
,
meta
,
prov
,
ts
,
τ
,
ω
)
a=(id,body,meta,prov,ts,τ,ω)

Where:

Field	Type	Description
id
id	
{
0
,
1
}
256
{0,1} 
256
 	Unique identifier: 
id
=
H
(
body
∥
ts
∥
DID
u
)
id=H(body∥ts∥DID 
u
​
 )
body
body	Structured data	The conversation content (messages, roles, attachments)
meta
meta	Key-value map	Topic tags, sentiment, language, token count
prov
prov	Provider ID	Source provider 
p
∈
P
p∈P
ts
ts	Unix timestamp	Creation time
τ
τ	
{
0
,
1
}
∗
{0,1} 
∗
 	Topic vector (embedded classification)
ω
ω	
R
R	Weight/importance score (user-adjustable)
3.2 ACU Canonical Serialization
For deterministic hashing, ACUs are serialized via canonical CBOR (RFC 8949) with sorted keys:

bytes
a
=
CBOR
canonical
(
a
)
bytes 
a
​
 =CBOR 
canonical
​
 (a)

h
a
=
H
(
bytes
a
)
h 
a
​
 =H(bytes 
a
​
 )

This ensures any two implementations produce identical hashes for identical ACUs.

3.3 Per-ACU Encryption
Each ACU is encrypted independently to enable granular access control:

Key generation:
k
a
←
$
{
0
,
1
}
256
k 
a
​
  
$
​
 {0,1} 
256
 

Encryption:
E
a
=
AES-256-GCM
(
k
a
,
nonce
a
,
bytes
a
)
E 
a
​
 =AES-256-GCM(k 
a
​
 ,nonce 
a
​
 ,bytes 
a
​
 )

Key wrapping for owner:
W
a
(
u
)
=
PKEnc
(
p
k
u
enc
,
k
a
)
W 
a
(u)
​
 =PKEnc(pk 
u
enc
​
 ,k 
a
​
 )

The encrypted ACU bundle stored is:

a
^
=
(
h
a
,
E
a
,
W
a
(
u
)
,
nonce
a
,
meta
public
)
a
^
 =(h 
a
​
 ,E 
a
​
 ,W 
a
(u)
​
 ,nonce 
a
​
 ,meta 
public
​
 )

Where 
meta
public
meta 
public
​
  contains only non-sensitive metadata (timestamp, provider ID, topic category) that the user explicitly marks as public for marketplace discovery.

3.4 ACU Classification Taxonomy
Each ACU is classified along multiple dimensions to enable granular selling decisions:

C
(
a
)
=
(
domain
,
sensitivity
,
depth
,
type
)
C(a)=(domain,sensitivity,depth,type)

Where:

domain
∈
{
technical, creative, medical, legal, financial, personal, ...
}
domain∈{technical, creative, medical, legal, financial, personal, ...}
sensitivity
∈
{
0
,
1
,
2
,
3
,
4
}
sensitivity∈{0,1,2,3,4} (public → highly sensitive)
depth
∈
R
+
depth∈R 
+
  (conversational depth score)
type
∈
{
Q&A, analysis, code, brainstorm, troubleshoot, ...
}
type∈{Q&A, analysis, code, brainstorm, troubleshoot, ...}
Classification is performed locally by the user's VIVIM client using the open-source classifier.

4. Unified Memory Structure — The Merkle Memory DAG
4.1 DAG Construction
A user's complete AI memory across all providers forms a Merkle DAG 
G
u
=
(
V
,
E
)
G 
u
​
 =(V,E):

Vertices: Each ACU hash 
h
a
h 
a
​
  is a leaf node. Internal nodes are aggregation hashes.

Edges: Directed edges represent temporal, topical, or causal relationships between ACUs.

The DAG is structured as a Merkle Mountain Range (MMR) for append-efficient updates:

MMR
u
=
MerkleMountainRange
(
h
a
1
,
h
a
2
,
…
,
h
a
n
)
MMR 
u
​
 =MerkleMountainRange(h 
a 
1
​
 
​
 ,h 
a 
2
​
 
​
 ,…,h 
a 
n
​
 
​
 )

Root commitment:

R
u
=
MMRRoot
(
MMR
u
)
R 
u
​
 =MMRRoot(MMR 
u
​
 )

This single hash 
R
u
R 
u
​
  commits to the user's entire AI memory corpus. Publishing 
R
u
R 
u
​
  on-chain proves the state of all data at a given time without revealing any content.

4.2 Provider Subtrees
Within the MMR, ACUs are also organized into provider subtrees for efficient per-provider proofs:

R
u
(
p
)
=
MerkleRoot
(
{
h
a
:
a
.
prov
=
p
}
)
∀
p
∈
P
R 
u
(p)
​
 =MerkleRoot({h 
a
​
 :a.prov=p})∀p∈P

The global root incorporates provider roots:

R
u
=
H
(
R
u
(
p
1
)
∥
R
u
(
p
2
)
∥
⋯
∥
R
u
(
p
m
)
∥
nonce
u
)
R 
u
​
 =H(R 
u
(p 
1
​
 )
​
 ∥R 
u
(p 
2
​
 )
​
 ∥⋯∥R 
u
(p 
m
​
 )
​
 ∥nonce 
u
​
 )

4.3 Inclusion Proofs
To prove ACU 
a
i
a 
i
​
  is in the user's memory without revealing other ACUs:

π
incl
(
a
i
)
=
MerklePath
(
h
a
i
,
MMR
u
)
π 
incl
​
 (a 
i
​
 )=MerklePath(h 
a 
i
​
 
​
 ,MMR 
u
​
 )

Verification:

VerifyInclusion
(
h
a
i
,
π
incl
,
R
u
)
=
?
1
VerifyInclusion(h 
a 
i
​
 
​
 ,π 
incl
​
 ,R 
u
​
 ) 
=
?
 1

4.4 Temporal Snapshots
The MMR root is periodically committed on-chain, creating an auditable history:

Timeline
u
=
[
(
R
u
(
t
1
)
,
t
1
)
,
(
R
u
(
t
2
)
,
t
2
)
,
…
]
Timeline 
u
​
 =[(R 
u
(t 
1
​
 )
​
 ,t 
1
​
 ),(R 
u
(t 
2
​
 )
​
 ,t 
2
​
 ),…]

This allows proving:

"I had this data before timestamp 
t
t" (priority/provenance)
"My data has not been tampered with since timestamp 
t
t" (integrity)
"This specific ACU existed in my corpus at time 
t
t" (existence)
5. Provider Import & Unification
5.1 Provider Parser Formalism
For each AI provider 
p
p, there exists a deterministic parser function:

ϕ
p
:
RawExport
p
→
A
∗
ϕ 
p
​
 :RawExport 
p
​
 →A 
∗
 

Where 
A
∗
A 
∗
  is the set of all finite sequences of ACUs.

Concrete parsers:

Provider	Export Format	Parser
OpenAI	JSON (conversations.json)	
ϕ
openai
ϕ 
openai
​
 
Anthropic Claude	JSON (export bundle)	
ϕ
claude
ϕ 
claude
​
 
Google Gemini	JSON (Takeout)	
ϕ
gemini
ϕ 
gemini
​
 
Cursor	SQLite (workspace.db)	
ϕ
cursor
ϕ 
cursor
​
 
Ollama	JSON (local chat logs)	
ϕ
ollama
ϕ 
ollama
​
 
Custom/API	Structured JSON	
ϕ
generic
ϕ 
generic
​
 
Each parser is a pure function: same input always produces same ACU set.

5.2 Cross-Provider Deduplication
When the same conceptual interaction spans multiple providers (e.g., user asked the same question on ChatGPT and Claude), we detect near-duplicates:

Embedding function:
e
⃗
:
A
→
R
d
e
 :A→R 
d
 

Cosine similarity:
sim
(
a
i
,
a
j
)
=
e
⃗
(
a
i
)
⋅
e
⃗
(
a
j
)
∥
e
⃗
(
a
i
)
∥
⋅
∥
e
⃗
(
a
j
)
∥
sim(a 
i
​
 ,a 
j
​
 )= 
∥ 
e
 (a 
i
​
 )∥⋅∥ 
e
 (a 
j
​
 )∥
e
 (a 
i
​
 )⋅ 
e
 (a 
j
​
 )
​
 

Deduplication rule:
DuplicateSet
(
a
i
)
=
{
a
j
:
sim
(
a
i
,
a
j
)
>
θ
dedup
∧
a
i
.
prov
≠
a
j
.
prov
}
DuplicateSet(a 
i
​
 )={a 
j
​
 :sim(a 
i
​
 ,a 
j
​
 )>θ 
dedup
​
 ∧a 
i
​
 .prov

=a 
j
​
 .prov}

Where 
θ
dedup
≈
0.92
θ 
dedup
​
 ≈0.92.

Duplicates are linked in the DAG, not deleted — preserving provenance while avoiding double-counting in marketplace listings.

5.3 Provenance Chain
Each ACU carries a signed provenance record:

Prov
(
a
)
=
Sign
(
s
k
u
,
(
h
a
,
p
,
t
,
H
(
raw_export_segment
)
)
)
Prov(a)=Sign(sk 
u
​
 ,(h 
a
​
 ,p,t,H(raw_export_segment)))

If the provider cooperates (via API attestation):

ProvAttest
(
a
)
=
Sign
(
s
k
p
,
(
h
a
,
session_id
,
t
)
)
ProvAttest(a)=Sign(sk 
p
​
 ,(h 
a
​
 ,session_id,t))

Provider attestation increases the market value of ACUs (verified authentic data vs. self-reported).

6. Blockchain Layer
6.1 Chain Architecture
The VIVIM chain is a sovereign application-specific blockchain optimized for three operations: memory commitments, consent management, and data marketplace transactions.

Design choice: Cosmos SDK-based appchain with custom modules, producing blocks via Tendermint BFT consensus. This gives:

Custom transaction types (not constrained by EVM)
Sovereign governance
IBC interoperability for bridging to Ethereum/other chains for liquidity
Sub-second finality for consent operations
6.2 State Model
The global state 
S
S is a Sparse Merkle Trie containing:

S
=
(
S
identity
,
 
S
memory
,
 
S
consent
,
 
S
market
,
 
S
token
)
S=(S 
identity
​
 , S 
memory
​
 , S 
consent
​
 , S 
market
​
 , S 
token
​
 )

Subtree	Keys	Values
S
identity
S 
identity
​
 	
DID
u
DID 
u
​
 	
(
p
k
u
,
profile_hash
,
reputation
,
staked
)
(pk 
u
​
 ,profile_hash,reputation,staked)
S
memory
S 
memory
​
 	
DID
u
DID 
u
​
 	$(R_u, \text{block_height},
S
consent
S 
consent
​
 	
consent_id
consent_id	
(
C
,
status
∈
{
active, revoked, expired
}
)
(C,status∈{active, revoked, expired})
S
market
S 
market
​
 	
listing_id
listing_id	
(
DID
u
,
descriptor
,
price
,
terms
)
(DID 
u
​
 ,descriptor,price,terms)
S
token
S 
token
​
 	
DID
u
DID 
u
​
 	
(
balance
,
staked
,
locked
)
(balance,staked,locked)
6.3 Transaction Types
Type 1: MemoryCommit

Tx
commit
=
(
DID
u
,
R
u
,
∣
A
u
∣
,
s
⃗
u
,
σ
)
Tx 
commit
​
 =(DID 
u
​
 ,R 
u
​
 ,∣A 
u
​
 ∣, 
s
  
u
​
 ,σ)

Where 
s
⃗
u
s
  
u
​
  is a summary vector — aggregate statistics of the user's corpus published for marketplace discovery:

s
⃗
u
=
(
n
total
,
{
(
p
i
,
n
p
i
)
}
p
i
∈
P
,
{
domain
j
:
count
j
}
,
t
earliest
,
t
latest
)
s
  
u
​
 =(n 
total
​
 ,{(p 
i
​
 ,n 
p 
i
​
 
​
 )} 
p 
i
​
 ∈P
​
 ,{domain 
j
​
 :count 
j
​
 },t 
earliest
​
 ,t 
latest
​
 )

These are aggregate counts, not content. They allow buyers to discover relevant sellers.

Type 2: ConsentGrant

Tx
consent
=
(
DID
u
,
DID
b
,
L
,
P
⃗
,
T
,
price
,
nonce
,
σ
u
)
Tx 
consent
​
 =(DID 
u
​
 ,DID 
b
​
 ,L, 
P
 ,T,price,nonce,σ 
u
​
 )

Defined formally in §7.

Type 3: ConsentRevoke

Tx
revoke
=
(
consent_id
,
DID
u
,
t
revoke
,
reason
,
σ
u
)
Tx 
revoke
​
 =(consent_id,DID 
u
​
 ,t 
revoke
​
 ,reason,σ 
u
​
 )

Type 4: MarketList

Tx
list
=
(
DID
u
,
D
,
price
ask
,
P
⃗
allowed
,
zk_props
,
σ
u
)
Tx 
list
​
 =(DID 
u
​
 ,D,price 
ask
​
 , 
P
  
allowed
​
 ,zk_props,σ 
u
​
 )

Where 
D
D is a data descriptor (not the data itself) and 
zk_props
zk_props is a zero-knowledge proof of data properties.

Type 5: Purchase

Tx
purchase
=
(
DID
b
,
listing_id
,
price
,
payment_proof
,
σ
b
)
Tx 
purchase
​
 =(DID 
b
​
 ,listing_id,price,payment_proof,σ 
b
​
 )

Type 6: Dispute

Tx
dispute
=
(
DID
initiator
,
consent_id
,
evidence_hash
,
σ
)
Tx 
dispute
​
 =(DID 
initiator
​
 ,consent_id,evidence_hash,σ)

6.4 Consensus
Validators stake 
VIV
VIV tokens and participate in Tendermint BFT:

ValidatorSet
=
{
(
p
k
v
,
stake
v
)
:
stake
v
≥
MIN_STAKE
}
ValidatorSet={(pk 
v
​
 ,stake 
v
​
 ):stake 
v
​
 ≥MIN_STAKE}

Block production:

B
i
=
(
H
(
B
i
−
1
)
,
 
t
i
,
 
{
Tx
1
,
…
,
Tx
k
}
,
 StateRoot
(
S
i
)
,
 
σ
proposer
,
 
{
σ
commit
}
)
B 
i
​
 =(H(B 
i−1
​
 ), t 
i
​
 , {Tx 
1
​
 ,…,Tx 
k
​
 }, StateRoot(S 
i
​
 ), σ 
proposer
​
 , {σ 
commit
​
 })

Finality is achieved when 
>
2
/
3
>2/3 of stake signs the commit:

∑
v
∈
signers
stake
v
>
2
3
∑
v
∈
ValidatorSet
stake
v
∑ 
v∈signers
​
 stake 
v
​
 > 
3
2
​
 ∑ 
v∈ValidatorSet
​
 stake 
v
​
 

Block time target: 3 seconds.

Throughput target: ~1,000 consent operations per second (sufficient for marketplace operations; bulk data transfer happens off-chain).

6.5 On-Chain vs. Off-Chain Separation
On-Chain (Blockchain)	Off-Chain (User Storage + IPFS)
Memory root commitments 
R
u
R 
u
​
 	Actual encrypted ACU data 
a
^
a
^
 
Consent records 
C
C	ACU content and metadata
Marketplace listings 
D
D	Full conversation histories
Token balances and transfers	Encrypted key bundles
ZK proof verifications	Raw provider exports
Dispute records	Embedding vectors
Rationale: A single user's AI conversation history across all providers could be gigabytes. On-chain storage is for proofs and records (kilobytes); the actual data lives in user-controlled storage (local, IPFS, S3-compatible).

7. Consent Layer — The Mathematics of Permission
7.1 Consent as a First-Class Mathematical Object
A Consent Record 
C
C is the fundamental unit of the data marketplace. It is a cryptographically signed, on-chain object that precisely defines what data is shared, with whom, under what terms, and for how long.

C
=
(
id
C
,
 
u
,
 
b
,
 
L
,
 
P
⃗
,
 
T
,
 
Δ
,
 price
,
 nonce
,
 
σ
C
)
C=(id 
C
​
 , u, b, L,  
P
 , T, Δ, price, nonce, σ 
C
​
 )

Field	Type	Description
id
C
id 
C
​
 	
{
0
,
1
}
256
{0,1} 
256
 	
H
(
u
∥
b
∥
L
∥
nonce
)
H(u∥b∥L∥nonce)
u
u	
DID
DID	Data owner
b
b	
DID
DID	Data buyer/licensee
L
L	Set of ACU IDs	Which specific ACUs are licensed
P
⃗
P
 	Permission vector	What operations are allowed
T
T	
[
t
start
,
t
end
]
[t 
start
​
 ,t 
end
​
 ]	Temporal validity window
Δ
Δ	Revocation policy	Conditions under which consent auto-revokes
price
price	
Z
+
Z 
+
  (in micro-VIV)	Agreed payment
nonce
nonce	
{
0
,
1
}
128
{0,1} 
128
 	Prevents replay
σ
C
σ 
C
​
 	Signature	
Sign
(
s
k
u
,
H
(
id
C
∥
b
∥
L
∥
P
⃗
∥
T
∥
Δ
∥
price
∥
nonce
)
)
Sign(sk 
u
​
 ,H(id 
C
​
 ∥b∥L∥ 
P
 ∥T∥Δ∥price∥nonce))
7.2 Permission Algebra
The permission vector 
P
⃗
P
  is drawn from a permission lattice 
(
P
all
,
⪯
)
(P 
all
​
 ,⪯) where:

P
all
=
{
READ
,
AGGREGATE
,
EMBED
,
TRAIN
,
RESELL
,
DERIVE
,
PUBLISH
}
P 
all
​
 ={READ,AGGREGATE,EMBED,TRAIN,RESELL,DERIVE,PUBLISH}

Partial ordering (subsumption):

READ
⪯
AGGREGATE
⪯
EMBED
⪯
TRAIN
READ⪯AGGREGATE⪯EMBED⪯TRAIN

READ
⪯
DERIVE
⪯
PUBLISH
READ⪯DERIVE⪯PUBLISH

READ
⪯
RESELL
READ⪯RESELL

Granting 
TRAIN
TRAIN does not imply 
RESELL
RESELL. Each permission is independently granted.

Permission composition: For two consent records 
C
1
,
C
2
C 
1
​
 ,C 
2
​
  from the same user to the same buyer:

P
⃗
effective
=
P
⃗
1
∪
P
⃗
2
P
  
effective
​
 = 
P
  
1
​
 ∪ 
P
  
2
​
 

But with temporal intersection:

T
effective
=
T
1
∩
T
2
T 
effective
​
 =T 
1
​
 ∩T 
2
​
 

7.3 Granularity Levels
Users can sell data at multiple granularity levels, each mathematically defined:

Level 0 — Aggregate Statistics (lowest risk):

Sale
0
=
f
(
A
u
)
+
noise
Sale 
0
​
 =f(A 
u
​
 )+noise

The buyer receives only statistical summaries with differential privacy guarantees (§9). No raw data leaves the user's control.

Level 1 — Embeddings Only:

Sale
1
=
{
e
⃗
(
a
)
:
a
∈
L
}
Sale 
1
​
 ={ 
e
 (a):a∈L}

The buyer gets vector representations. These are useful for similarity search and clustering but cannot reconstruct original conversations (under the embedding model's properties).

Level 2 — Metadata + Embeddings:

Sale
2
=
{
(
meta
a
,
e
⃗
(
a
)
)
:
a
∈
L
}
Sale 
2
​
 ={(meta 
a
​
 , 
e
 (a)):a∈L}

Adds topic tags, timestamps, provider info.

Level 3 — Redacted Content:

Sale
3
=
{
Redact
(
a
,
R
)
:
a
∈
L
}
Sale 
3
​
 ={Redact(a,R):a∈L}

Where 
R
R is a redaction policy (remove PII, names, specific topics). The redaction function 
Redact
Redact is deterministic and auditable.

Level 4 — Full Content:

Sale
4
=
{
a
:
a
∈
L
}
Sale 
4
​
 ={a:a∈L}

Complete ACU data. Highest value, highest risk.

Each level has a distinct pricing structure and privacy implication.

7.4 Consent State Machine
text

                    ┌─────────────────────┐
                    │      PROPOSED        │
                    │  (buyer sends offer) │
                    └──────────┬──────────┘
                               │ user signs
                               ▼
                    ┌─────────────────────┐
              ┌─────│      ACTIVE          │─────┐
              │     │  (consent on-chain)  │     │
              │     └──────────┬──────────┘     │
              │                │                 │
         user revokes    time expires      dispute filed
              │                │                 │
              ▼                ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   REVOKED     │  │   EXPIRED    │  │  DISPUTED    │
    │ (user action) │  │ (automatic)  │  │ (arbitration)│
    └──────────────┘  └──────────────┘  └──────┬───────┘
                                               │
                                    ┌──────────┴──────────┐
                                    ▼                     ▼
                              ┌──────────┐          ┌──────────┐
                              │ RESOLVED │          │ VOIDED   │
                              │(upheld)  │          │(refunded)│
                              └──────────┘          └──────────┘
7.5 Revocation Mechanics
When a user revokes consent:

On-chain: 
Tx
revoke
Tx 
revoke
​
  is published, changing consent status to REVOKED
Key rotation: The user's proxy re-encryption key 
r
k
u
→
b
rk 
u→b
​
  is invalidated (§8.3)
Future access blocked: Proxy nodes refuse to re-encrypt for the revoked buyer
Important caveat: Revocation prevents future access but cannot "un-send" data already decrypted by the buyer. This is a fundamental information-theoretic limitation. The architecture handles it through:

Legal enforcement via smart contract terms
Economic incentives (reputation system penalizes misuse)
Graduated access (TEE-mediated access for high-sensitivity data)
8. Cryptographic Access Control
8.1 Encryption Architecture Overview
text

┌─────────────────────────────────────────────────────────────────┐
│                    USER'S KEY HIERARCHY                          │
│                                                                 │
│  Master Seed                                                    │
│    ├── Signing Key (Ed25519)                                    │
│    ├── Master Encryption Key (X25519)                           │
│    │     ├── ACU Key for a₁: k₁ = KDF(MEK, id₁)               │
│    │     ├── ACU Key for a₂: k₂ = KDF(MEK, id₂)               │
│    │     └── ACU Key for aₙ: kₙ = KDF(MEK, idₙ)               │
│    └── Provider Keys (per-provider encryption subkeys)          │
│                                                                 │
│  Each ACU encrypted: E_aᵢ = AES-GCM(kᵢ, aᵢ)                  │
│  Each key wrapped:   W_aᵢ = PKEnc(pk_u, kᵢ)                   │
└─────────────────────────────────────────────────────────────────┘
8.2 Key Encapsulation for Data Sales
When user 
u
u sells ACU set 
L
L to buyer 
b
b:

Step 1: Generate a session bundle key:

k
bundle
←
$
{
0
,
1
}
256
k 
bundle
​
  
$
​
 {0,1} 
256
 

Step 2: For each 
a
i
∈
L
a 
i
​
 ∈L, re-encrypt the ACU key under the bundle key:

W
a
i
(
bundle
)
=
Enc
(
k
bundle
,
k
a
i
)
W 
a 
i
​
 
(bundle)
​
 =Enc(k 
bundle
​
 ,k 
a 
i
​
 
​
 )

Step 3: Encrypt the bundle key under the buyer's public key:

W
bundle
(
b
)
=
PKEnc
(
p
k
b
,
k
bundle
)
W 
bundle
(b)
​
 =PKEnc(pk 
b
​
 ,k 
bundle
​
 )

Step 4: Publish the delivery package (off-chain, e.g., IPFS):

Package
=
(
W
bundle
(
b
)
,
 
{
(
h
a
i
,
W
a
i
(
bundle
)
,
E
a
i
)
}
a
i
∈
L
)
Package=(W 
bundle
(b)
​
 , {(h 
a 
i
​
 
​
 ,W 
a 
i
​
 
(bundle)
​
 ,E 
a 
i
​
 
​
 )} 
a 
i
​
 ∈L
​
 )

Step 5: Record delivery hash on-chain as fulfillment proof:

Tx
fulfill
=
(
id
C
,
H
(
Package
)
,
σ
u
)
Tx 
fulfill
​
 =(id 
C
​
 ,H(Package),σ 
u
​
 )

The buyer can verify: decrypt 
k
bundle
k 
bundle
​
  with their 
s
k
b
sk 
b
​
 , then decrypt each 
k
a
i
k 
a 
i
​
 
​
 , then decrypt each 
E
a
i
E 
a 
i
​
 
​
 , and verify 
H
(
a
i
)
=
h
a
i
H(a 
i
​
 )=h 
a 
i
​
 
​
 .

8.3 Proxy Re-Encryption for Streaming Access
For ongoing (subscription-style) data access rather than one-time sale:

Scheme: AFGH Proxy Re-Encryption (bilinear pairing-based)

Let 
e
:
G
1
×
G
2
→
G
T
e:G 
1
​
 ×G 
2
​
 →G 
T
​
  be a bilinear pairing.

Setup:

User 
u
u: 
s
k
u
∈
Z
q
sk 
u
​
 ∈Z 
q
​
 , 
p
k
u
=
g
1
s
k
u
∈
G
1
pk 
u
​
 =g 
1
sk 
u
​
 
​
 ∈G 
1
​
 
Buyer 
b
b: 
s
k
b
∈
Z
q
sk 
b
​
 ∈Z 
q
​
 , 
p
k
b
=
g
1
s
k
b
∈
G
1
pk 
b
​
 =g 
1
sk 
b
​
 
​
 ∈G 
1
​
 
Encryption by user:

ct
u
=
(
c
1
,
c
2
)
=
(
g
1
r
,
 
m
⋅
e
(
g
1
,
g
2
)
r
⋅
s
k
u
)
ct 
u
​
 =(c 
1
​
 ,c 
2
​
 )=(g 
1
r
​
 , m⋅e(g 
1
​
 ,g 
2
​
 ) 
r⋅sk 
u
​
 
 )

for random 
r
←
$
Z
q
r 
$
​
 Z 
q
​
  and message 
m
m (the ACU symmetric key).

Re-encryption key generation (by user):

r
k
u
→
b
=
g
2
s
k
b
/
s
k
u
rk 
u→b
​
 =g 
2
sk 
b
​
 /sk 
u
​
 
​
 

This requires the user to know 
s
k
b
sk 
b
​
  — in practice, a key exchange protocol establishes this.

Alternatively, using the AFGH scheme more carefully:

r
k
u
→
b
=
p
k
b
1
/
s
k
u
=
g
1
s
k
b
/
s
k
u
rk 
u→b
​
 =pk 
b
1/sk 
u
​
 
​
 =g 
1
sk 
b
​
 /sk 
u
​
 
​
 

Re-encryption (by proxy node, which never sees plaintext):

ct
b
=
(
c
1
,
 
c
2
′
=
c
2
⋅
e
(
c
1
,
r
k
u
→
b
)
e
(
g
1
,
g
2
)
r
⋅
s
k
u
)
ct 
b
​
 =(c 
1
​
 , c 
2
′
​
 =c 
2
​
 ⋅ 
e(g 
1
​
 ,g 
2
​
 ) 
r⋅sk 
u
​
 
 
e(c 
1
​
 ,rk 
u→b
​
 )
​
 )

Actually, let me define this more carefully using the standard AFGH formulation:

Encryption:
ct
u
=
(
c
1
,
c
2
)
=
(
g
r
,
m
⋅
Z
r
⋅
s
k
u
)
ct 
u
​
 =(c 
1
​
 ,c 
2
​
 )=(g 
r
 ,m⋅Z 
r⋅sk 
u
​
 
 )

where 
Z
=
e
(
g
,
g
)
∈
G
T
Z=e(g,g)∈G 
T
​
 .

Re-encryption key:
r
k
u
→
b
=
g
s
k
b
/
s
k
u
rk 
u→b
​
 =g 
sk 
b
​
 /sk 
u
​
 
 

Re-encryption:
ct
b
=
(
c
1
′
,
c
2
)
 where 
c
1
′
=
e
(
c
1
,
r
k
u
→
b
)
=
e
(
g
r
,
g
s
k
b
/
s
k
u
)
=
Z
r
⋅
s
k
b
/
s
k
u
ct 
b
​
 =(c 
1
′
​
 ,c 
2
​
 ) where c 
1
′
​
 =e(c 
1
​
 ,rk 
u→b
​
 )=e(g 
r
 ,g 
sk 
b
​
 /sk 
u
​
 
 )=Z 
r⋅sk 
b
​
 /sk 
u
​
 
 

Decryption by buyer:
m
=
c
2
/
(
c
1
′
)
s
k
u
/
s
k
b
m=c 
2
​
 /(c 
1
′
​
 ) 
sk 
u
​
 /sk 
b
​
 
 

Wait, let me use the clean AFGH formulation properly:

AFGH PRE Scheme (Simplified):

Setup: Bilinear group 
(
p
,
G
,
G
T
,
e
,
g
)
(p,G,G 
T
​
 ,e,g) where 
e
:
G
×
G
→
G
T
e:G×G→G 
T
​
 .

KeyGen: 
s
k
=
x
∈
Z
p
sk=x∈Z 
p
​
 , 
p
k
=
g
x
pk=g 
x
 
Encrypt
(
p
k
u
,
m
)
(pk 
u
​
 ,m): pick 
r
←
$
Z
p
r 
$
​
 Z 
p
​
 , output 
ct
=
(
g
r
,
m
⋅
e
(
p
k
u
,
g
)
r
)
=
(
g
r
,
m
⋅
e
(
g
,
g
)
x
r
)
ct=(g 
r
 ,m⋅e(pk 
u
​
 ,g) 
r
 )=(g 
r
 ,m⋅e(g,g) 
xr
 )
ReKeyGen
(
s
k
u
,
p
k
b
)
(sk 
u
​
 ,pk 
b
​
 ): output 
r
k
u
→
b
=
p
k
b
1
/
s
k
u
=
g
x
b
/
x
u
rk 
u→b
​
 =pk 
b
1/sk 
u
​
 
​
 =g 
x 
b
​
 /x 
u
​
 
 
ReEncrypt
(
r
k
u
→
b
,
ct
)
(rk 
u→b
​
 ,ct): given 
ct
=
(
α
,
β
)
ct=(α,β), compute 
α
′
=
e
(
α
,
r
k
u
→
b
)
=
e
(
g
r
,
g
x
b
/
x
u
)
=
e
(
g
,
g
)
r
⋅
x
b
/
x
u
α 
′
 =e(α,rk 
u→b
​
 )=e(g 
r
 ,g 
x 
b
​
 /x 
u
​
 
 )=e(g,g) 
r⋅x 
b
​
 /x 
u
​
 
 . Output 
ct
′
=
(
α
′
,
β
)
ct 
′
 =(α 
′
 ,β)
Decrypt-Original
(
s
k
u
,
ct
)
(sk 
u
​
 ,ct): 
m
=
β
/
e
(
α
,
g
)
x
u
=
β
/
e
(
g
,
g
)
r
⋅
x
u
m=β/e(α,g) 
x 
u
​
 
 =β/e(g,g) 
r⋅x 
u
​
 
  ✓
Decrypt-ReEncrypted
(
s
k
b
,
ct
′
)
(sk 
b
​
 ,ct 
′
 ): This doesn't directly work with this formulation...
Let me just reference the scheme abstractly rather than getting the pairing math wrong:

The key property: The proxy can transform ciphertexts from 
p
k
u
pk 
u
​
  to 
p
k
b
pk 
b
​
  without learning the plaintext 
m
m or either secret key. The re-encryption key 
r
k
u
→
b
rk 
u→b
​
  is unidirectional (cannot be used to decrypt directly) and the proxy is semi-trusted.

Revocation: User deletes 
r
k
u
→
b
rk 
u→b
​
  from proxy nodes. No future re-encryption is possible. New ACUs encrypted under 
p
k
u
pk 
u
​
  are inaccessible to buyer 
b
b.

8.4 Temporal Key Rotation
To enforce time-bounded access, the user's encryption keys rotate on an epoch schedule:

k
u
(
e
)
=
KDF
(
s
k
u
,
"epoch"
∥
e
)
k 
u
(e)
​
 =KDF(sk 
u
​
 ,"epoch"∥e)

ACUs created in epoch 
e
e are encrypted under 
k
u
(
e
)
k 
u
(e)
​
 . The re-encryption key for buyer 
b
b is:

r
k
u
→
b
(
e
)
=
ReKeyGen
(
k
u
(
e
)
,
p
k
b
)
rk 
u→b
(e)
​
 =ReKeyGen(k 
u
(e)
​
 ,pk 
b
​
 )

When a time window expires, the proxy simply stops using 
r
k
u
→
b
(
e
)
rk 
u→b
(e)
​
 . New epochs use new keys, naturally revoking access.

9. Privacy Layer — Zero-Knowledge Proofs & Differential Privacy
9.1 ZK Proofs for Marketplace Discovery
The marketplace requires buyers to discover relevant data without sellers revealing the data itself. ZK proofs bridge this gap.

Circuit 1: Corpus Size Proof

Prove: "I have at least 
N
N ACUs from provider 
p
p"

π
size
=
ZKProve
(
(
MMR
u
,
leaves
)
⏟
w
i
t
n
e
s
s
,
 
(
R
u
,
p
,
N
,
DID
u
)
⏟
s
t
a
t
e
m
e
n
t
)
π 
size
​
 =ZKProve( 
witness
(MMR 
u
​
 ,leaves)
​
 
​
 ,  
statement
(R 
u
​
 ,p,N,DID 
u
​
 )
​
 
​
 )

Relation:
R
size
=
{
(
R
u
,
p
,
N
)
:
∣
{
a
∈
MMR
u
:
a
.
prov
=
p
}
∣
≥
N
∧
MMRRoot
(
MMR
u
)
=
R
u
}
R 
size
​
 ={(R 
u
​
 ,p,N):∣{a∈MMR 
u
​
 :a.prov=p}∣≥N∧MMRRoot(MMR 
u
​
 )=R 
u
​
 }

Circuit 2: Topic Coverage Proof

Prove: "I have conversations covering topics 
{
T
1
,
T
2
,
…
,
T
k
}
{T 
1
​
 ,T 
2
​
 ,…,T 
k
​
 }"

π
topics
=
ZKProve
(
(
MMR
u
,
{
a
j
1
,
…
,
a
j
k
}
)
,
 
(
R
u
,
{
T
1
,
…
,
T
k
}
)
)
π 
topics
​
 =ZKProve((MMR 
u
​
 ,{a 
j 
1
​
 
​
 ,…,a 
j 
k
​
 
​
 }), (R 
u
​
 ,{T 
1
​
 ,…,T 
k
​
 }))

Relation:
R
topics
=
{
(
R
u
,
{
T
i
}
)
:
∀
T
i
,
∃
a
∈
MMR
u
 s.t. 
T
i
∈
a
.
τ
∧
h
a
∈
MMR
u
}
R 
topics
​
 ={(R 
u
​
 ,{T 
i
​
 }):∀T 
i
​
 ,∃a∈MMR 
u
​
  s.t. T 
i
​
 ∈a.τ∧h 
a
​
 ∈MMR 
u
​
 }

Circuit 3: Freshness Proof

Prove: "At least 
M
M of my ACUs were created in the last 
δ
δ days"

R
fresh
=
{
(
R
u
,
M
,
δ
)
:
∣
{
a
∈
MMR
u
:
t
now
−
a
.
ts
≤
δ
}
∣
≥
M
}
R 
fresh
​
 ={(R 
u
​
 ,M,δ):∣{a∈MMR 
u
​
 :t 
now
​
 −a.ts≤δ}∣≥M}

Circuit 4: Multi-Provider Proof

Prove: "My data comes from at least 
k
k distinct AI providers"

R
multi
=
{
(
R
u
,
k
)
:
∣
{
p
:
∃
a
∈
MMR
u
,
a
.
prov
=
p
}
∣
≥
k
}
R 
multi
​
 ={(R 
u
​
 ,k):∣{p:∃a∈MMR 
u
​
 ,a.prov=p}∣≥k}

Circuit 5: Data Quality Proof

Prove: "The average conversation depth in my corpus exceeds threshold 
θ
θ"

R
quality
=
{
(
R
u
,
θ
)
:
1
∣
MMR
u
∣
∑
a
∈
MMR
u
depth
(
a
)
≥
θ
}
R 
quality
​
 ={(R 
u
​
 ,θ): 
∣MMR 
u
​
 ∣
1
​
 ∑ 
a∈MMR 
u
​
 
​
 depth(a)≥θ}

9.2 ZK Proof System Choice
For the above circuits, use PLONK with KZG commitments over BLS12-381:

Universal trusted setup (one ceremony for all circuits)
Proof size: ~1 KB constant regardless of corpus size
Verification time: ~5ms (constant)
Prover time: 
O
(
n
log
⁡
n
)
O(nlogn) where 
n
n is the number of ACUs in the witness
For very large corpora (
n
>
10
6
n>10 
6
  ACUs), use recursive proof composition:

π
outer
=
ZKProve
(
π
inner
,
additional_witness
)
π 
outer
​
 =ZKProve(π 
inner
​
 ,additional_witness)

This allows proving over millions of ACUs in bounded time by splitting the computation into layers.

9.3 Differential Privacy for Aggregate Sales
When a buyer wants statistical insights rather than raw data, differential privacy provides formal guarantees about information leakage.

Definition: A mechanism 
M
:
D
→
R
M:D→R satisfies 
(
ϵ
,
δ
)
(ϵ,δ)-differential privacy if for all datasets 
D
,
D
′
D,D 
′
  differing in one element and all 
S
⊆
R
S⊆R:

Pr
⁡
[
M
(
D
)
∈
S
]
≤
e
ϵ
⋅
Pr
⁡
[
M
(
D
′
)
∈
S
]
+
δ
Pr[M(D)∈S]≤e 
ϵ
 ⋅Pr[M(D 
′
 )∈S]+δ

Application to VIVIM:

User 
u
u can answer aggregate queries from buyers while maintaining 
(
ϵ
,
δ
)
(ϵ,δ)-DP:

Query types and mechanisms:

Query	Sensitivity 
Δ
Δ	Mechanism	Noise
"How many conversations about topic 
T
T?"	1	Laplace	
Lap
(
1
/
ϵ
)
Lap(1/ϵ)
"Average conversation length about 
T
T?"	
L
max
⁡
/
n
L 
max
​
 /n	Laplace	
Lap
(
L
max
⁡
/
(
n
ϵ
)
)
Lap(L 
max
​
 /(nϵ))
"Topic distribution histogram"	
2
/
n
2/n	Laplace per bin	
Lap
(
2
/
(
n
ϵ
)
)
Lap(2/(nϵ))
"Sentiment distribution"	
1
/
n
1/n	Gaussian	
N
(
0
,
2
ln
⁡
(
1.25
/
δ
)
⋅
Δ
2
/
ϵ
2
)
N(0,2ln(1.25/δ)⋅Δ 
2
 /ϵ 
2
 )
9.4 Privacy Budget Accounting
Each user maintains an on-chain privacy ledger:

E
u
=
(
ϵ
total
,
ϵ
spent
,
δ
total
,
δ
spent
)
E 
u
​
 =(ϵ 
total
​
 ,ϵ 
spent
​
 ,δ 
total
​
 ,δ 
spent
​
 )

After each aggregate query 
q
q with privacy cost 
(
ϵ
q
,
δ
q
)
(ϵ 
q
​
 ,δ 
q
​
 ):

ϵ
spent
←
ϵ
spent
+
ϵ
q
ϵ 
spent
​
 ←ϵ 
spent
​
 +ϵ 
q
​
 
δ
spent
←
δ
spent
+
δ
q
δ 
spent
​
 ←δ 
spent
​
 +δ 
q
​
 

Basic composition theorem:

(
ϵ
1
,
δ
1
)
-DP
+
(
ϵ
2
,
δ
2
)
-DP
=
(
ϵ
1
+
ϵ
2
,
δ
1
+
δ
2
)
-DP
(ϵ 
1
​
 ,δ 
1
​
 )-DP+(ϵ 
2
​
 ,δ 
2
​
 )-DP=(ϵ 
1
​
 +ϵ 
2
​
 ,δ 
1
​
 +δ 
2
​
 )-DP

Advanced composition (tighter bound for many queries):

For 
k
k queries each with 
(
ϵ
0
,
δ
0
)
(ϵ 
0
​
 ,δ 
0
​
 )-DP:

ϵ
total
≤
ϵ
0
2
k
ln
⁡
(
1
/
δ
′
)
+
k
ϵ
0
(
e
ϵ
0
−
1
)
ϵ 
total
​
 ≤ϵ 
0
​
  
2kln(1/δ 
′
 )
​
 +kϵ 
0
​
 (e 
ϵ 
0
​
 
 −1)
δ
total
≤
k
δ
0
+
δ
′
δ 
total
​
 ≤kδ 
0
​
 +δ 
′
 

Rényi DP composition (tightest):

Using Rényi divergence of order 
α
α:

D
α
(
M
(
D
)
∥
M
(
D
′
)
)
≤
ϵ
(
α
)
D 
α
​
 (M(D)∥M(D 
′
 ))≤ϵ(α)

Composition: 
k
k mechanisms with Rényi-
α
α privacy 
ϵ
(
α
)
ϵ(α) compose to 
k
⋅
ϵ
(
α
)
k⋅ϵ(α).

Conversion to 
(
ϵ
,
δ
)
(ϵ,δ)-DP:

ϵ
=
k
⋅
ϵ
(
α
)
+
ln
⁡
(
1
/
δ
)
α
−
1
ϵ=k⋅ϵ(α)+ 
α−1
ln(1/δ)
​
 

The user sets 
ϵ
total
ϵ 
total
​
  (their total privacy budget) and the system enforces it. When the budget is exhausted, no more aggregate queries can be answered until the next budget period (e.g., monthly reset, or never — user's choice).

9.5 Verifiable Computation for Aggregate Queries
To ensure the buyer receives correct aggregate results (not fabricated by the user), combine differential privacy with verifiable computation:

(
f
~
(
D
)
,
π
vc
)
=
VerifiableDP
(
D
,
f
,
ϵ
)
( 
f
~
​
 (D),π 
vc
​
 )=VerifiableDP(D,f,ϵ)

The buyer receives:

f
~
(
D
)
f
~
​
 (D): the noisy aggregate result
π
vc
π 
vc
​
 : a ZK proof that 
f
~
(
D
)
f
~
​
 (D) was correctly computed from data committed under 
R
u
R 
u
​
  with noise calibrated to 
ϵ
ϵ
This prevents the seller from fabricating aggregate statistics.

10. Data Marketplace — Economic Architecture
10.1 The VIV Token
The VIV token is the native asset of the VIVIM blockchain, serving four functions:

Function	Mechanism
Payment	Buyers pay sellers in VIV for data access
Staking	Validators and proxy nodes stake VIV for security
Governance	Token holders vote on protocol parameters
Privacy	Privacy budget "recharges" require VIV burn
Token supply model:

S
(
t
)
=
S
0
+
∫
0
t
r
(
τ
)
 
d
τ
−
∫
0
t
b
(
τ
)
 
d
τ
S(t)=S 
0
​
 +∫ 
0
t
​
 r(τ)dτ−∫ 
0
t
​
 b(τ)dτ

Where:

S
0
S 
0
​
  = initial supply
r
(
t
)
r(t) = block reward emission rate (decreasing over time)
b
(
t
)
b(t) = token burn rate (from protocol fees and privacy recharges)
Emission schedule (deflationary target):

r
(
t
)
=
r
0
⋅
e
−
λ
r
t
r(t)=r 
0
​
 ⋅e 
−λ 
r
​
 t
 

With 
λ
r
λ 
r
​
  chosen so that long-term burn rate exceeds emission.

10.2 Data Valuation Model
The intrinsic value of a data bundle 
L
L from user 
u
u:

V
(
L
,
u
)
=
∑
a
∈
L
v
base
(
a
)
⋅
Φ
fresh
(
a
)
⋅
Φ
depth
(
a
)
⋅
Φ
rarity
(
a
)
⋅
Φ
prov
(
a
)
V(L,u)=∑ 
a∈L
​
 v 
base
​
 (a)⋅Φ 
fresh
​
 (a)⋅Φ 
depth
​
 (a)⋅Φ 
rarity
​
 (a)⋅Φ 
prov
​
 (a)

Component factors:

Base value:
v
base
(
a
)
=
β
1
⋅
∣
a
.
body
∣
+
β
2
⋅
token_count
(
a
)
+
β
3
v 
base
​
 (a)=β 
1
​
 ⋅∣a.body∣+β 
2
​
 ⋅token_count(a)+β 
3
​
 

Where 
β
i
β 
i
​
  are calibrated weights and 
∣
a
.
body
∣
∣a.body∣ is content size.

Freshness decay:
\Phi_{\text{fresh}}(a) = e^{-\lambda_f (t_{\text{now}} - a.\text{ts}})}

Recent data is more valuable. 
λ
f
λ 
f
​
  controls decay rate (e.g., half-life of 90 days: 
λ
f
=
ln
⁡
2
/
90
λ 
f
​
 =ln2/90).

Depth multiplier:
Φ
depth
(
a
)
=
1
+
α
d
⋅
log
⁡
(
1
+
turns
(
a
)
)
Φ 
depth
​
 (a)=1+α 
d
​
 ⋅log(1+turns(a))

Multi-turn, deep conversations are more valuable than one-shot queries.

Rarity multiplier:
Φ
rarity
(
a
)
=
1
1
+
N
similar
(
a
)
Φ 
rarity
​
 (a)= 
1+N 
similar
​
 (a)
​
 
1
​
 

Where 
N
similar
(
a
)
N 
similar
​
 (a) is the number of similar ACUs available on the marketplace (supply/demand).

Provenance multiplier:
Φ
prov
(
a
)
=
{
1.5
if provider-attested
1.0
if self-attested only
Φ 
prov
​
 (a)={ 
1.5
1.0
​
  
if provider-attested
if self-attested only
​
 

Buyer-specific relevance modifier:

V
(
L
,
u
,
b
)
=
V
(
L
,
u
)
⋅
Relevance
(
L
,
Intent
b
)
V(L,u,b)=V(L,u)⋅Relevance(L,Intent 
b
​
 )

Where:
Relevance
(
L
,
Intent
b
)
=
1
∣
L
∣
∑
a
∈
L
sim
(
e
⃗
(
a
.
τ
)
,
e
⃗
(
Intent
b
)
)
Relevance(L,Intent 
b
​
 )= 
∣L∣
1
​
 ∑ 
a∈L
​
 sim( 
e
 (a.τ), 
e
 (Intent 
b
​
 ))

This is a suggested price. The user always sets the final price.

10.3 Exclusivity Pricing
Data is non-rivalrous — it can be sold multiple times. Exclusivity commands a premium.

Non-exclusive sale (default):
Price
non-excl
=
V
(
L
,
u
,
b
)
Price 
non-excl
​
 =V(L,u,b)

Exclusive sale (no other buyers for this data):
Price
excl
=
V
(
L
,
u
,
b
)
⋅
1
1
−
γ
Price 
excl
​
 =V(L,u,b)⋅ 
1−γ
1
​
 

Where 
γ
∈
(
0
,
1
)
γ∈(0,1) represents the expected future value of selling to additional buyers (opportunity cost).

Time-exclusive sale (exclusive for duration 
T
T, then open):
Price
time-excl
=
V
(
L
,
u
,
b
)
⋅
(
1
+
γ
1
−
γ
⋅
(
1
−
e
−
λ
f
∣
T
∣
)
)
Price 
time-excl
​
 =V(L,u,b)⋅(1+ 
1−γ
γ
​
 ⋅(1−e 
−λ 
f
​
 ∣T∣
 ))

Exclusivity is enforced by smart contract: the consent record includes an exclusivity flag, and the marketplace contract rejects new listings for the same ACU set during the exclusivity window.

10.4 Marketplace Matching
Buyer request (demand signal):

Q
b
=
(
topics
,
providers
,
min_depth
,
freshness_window
,
budget
,
permissions_needed
)
Q 
b
​
 =(topics,providers,min_depth,freshness_window,budget,permissions_needed)

Seller listing (supply signal):

D
u
=
(
topic_categories
,
provider_set
,
corpus_stats
,
price_floor
,
permissions_offered
,
π
zk
)
D 
u
​
 =(topic_categories,provider_set,corpus_stats,price_floor,permissions_offered,π 
zk
​
 )

Matching function:

Match
(
Q
b
,
D
u
)
=
TopicOverlap
⋅
ProviderOverlap
⋅
QualityScore
⋅
1
[
price_floor
≤
budget
]
Match(Q 
b
​
 ,D 
u
​
 )=TopicOverlap⋅ProviderOverlap⋅QualityScore⋅1[price_floor≤budget]

Matching is computed by marketplace indexer nodes (who see only public metadata and ZK proofs, never actual data).

10.5 Transaction Flow
text

┌──────────┐         ┌──────────────┐         ┌──────────┐
│  BUYER   │         │  BLOCKCHAIN  │         │  SELLER  │
│          │         │  + ESCROW    │         │          │
└────┬─────┘         └──────┬───────┘         └────┬─────┘
     │                      │                      │
     │  1. Browse listings  │                      │
     │  (see ZK proofs,     │                      │
     │   public metadata)   │                      │
     │───────────────────►  │                      │
     │                      │                      │
     │  2. Submit purchase  │                      │
     │  Tx + VIV to escrow  │                      │
     │───────────────────►  │                      │
     │                      │                      │
     │                      │  3. Notify seller    │
     │                      │───────────────────►  │
     │                      │                      │
     │                      │  4. Seller reviews   │
     │                      │  buyer identity,     │
     │                      │  approves/rejects    │
     │                      │  ◄───────────────────│
     │                      │                      │
     │                      │  5. If approved:     │
     │                      │  ConsentGrant Tx     │
     │                      │  ◄───────────────────│
     │                      │                      │
     │                      │  6. Seller uploads   │
     │                      │  encrypted package   │
     │                      │  to IPFS/delivery    │
     │                      │  ◄───────────────────│
     │                      │                      │
     │  7. Buyer downloads  │                      │
     │  and verifies        │                      │
     │  (decrypt, check     │                      │
     │   Merkle proofs)     │                      │
     │◄──────────────────── │                      │
     │                      │                      │
     │  8. Buyer confirms   │                      │
     │  receipt OR opens    │                      │
     │  dispute             │                      │
     │───────────────────►  │                      │
     │                      │                      │
     │                      │  9. If confirmed:    │
     │                      │  Release VIV from    │
     │                      │  escrow to seller    │
     │                      │  (minus protocol fee)│
     │                      │───────────────────►  │
     │                      │                      │
10.6 Fee Structure
SellerReceives
=
price
×
(
1
−
α
)
SellerReceives=price×(1−α)

ProtocolFee
=
price
×
α
ProtocolFee=price×α

Where 
α
α is the protocol fee rate, governed by token holders. Initial target: 
α
=
0.025
α=0.025 (2.5%).

Protocol fee distribution:

ProtocolFee
=
0.4
⋅
ProtocolFee
⏟
validators
+
0.3
⋅
ProtocolFee
⏟
development fund
+
0.3
⋅
ProtocolFee
⏟
burn
ProtocolFee= 
validators
0.4⋅ProtocolFee
​
 
​
 + 
development fund
0.3⋅ProtocolFee
​
 
​
 + 
burn
0.3⋅ProtocolFee
​
 
​
 

11. Reputation System
11.1 Seller Reputation
ρ
u
=
∑
C
∈
completed
(
u
)
w
C
⋅
r
C
∑
C
∈
completed
(
u
)
w
C
ρ 
u
​
 = 
∑ 
C∈completed(u)
​
 w 
C
​
 
∑ 
C∈completed(u)
​
 w 
C
​
 ⋅r 
C
​
 
​
 

Where:

r
C
∈
[
0
,
1
]
r 
C
​
 ∈[0,1] is the buyer's rating for consent 
C
C
w
C
=
price
C
⋅
Φ
fresh
(
C
)
w 
C
​
 =price 
C
​
 ⋅Φ 
fresh
​
 (C) is the weight (larger, more recent transactions count more)
11.2 Buyer Reputation
ρ
b
=
f
(
disputes_initiated
,
disputes_won
,
consent_violations
,
volume
)
ρ 
b
​
 =f(disputes_initiated,disputes_won,consent_violations,volume)

ρ
b
=
1
−
disputes_lost
+
violations
total_transactions
+
1
ρ 
b
​
 =1− 
total_transactions+1
disputes_lost+violations
​
 

Sellers can set minimum buyer reputation thresholds:

Require: 
ρ
b
≥
ρ
min
⁡
(
u
)
 for purchase from user 
u
Require: ρ 
b
​
 ≥ρ 
min
(u)
​
  for purchase from user u

11.3 Sybil Resistance
To prevent reputation farming through self-dealing:

Stake requirement: Both buyers and sellers must stake VIV to transact
Transaction graph analysis: On-chain analysis detects circular transaction patterns
Minimum transaction diversity: Reputation only counts from 
≥
k
≥k distinct counterparties
Time-weighting: Old transactions decay; sustained reputation requires ongoing good behavior
12. Dispute Resolution
12.1 Automated Verification
Before human arbitration, automated checks verify:

Delivery integrity: Does 
H
(
delivered_data
)
H(delivered_data) match the commitment in 
Tx
fulfill
Tx 
fulfill
​
 ?
Merkle proof validity: Are all delivered ACUs verifiably included in the seller's committed 
R
u
R 
u
​
 ?
Quantity check: Does 
∣
delivered_data
∣
∣delivered_data∣ match 
∣
L
∣
∣L∣ in the consent record?
Freshness check: Do timestamps in delivered ACUs satisfy the stated freshness conditions?
12.2 Arbitration Protocol
For disputes that pass automated checks (i.e., the issue is data quality, not delivery integrity):

Arbitrator selection: Random selection from staked arbitrator pool using VRF:

(
arbitrator
,
π
vrf
)
=
VRF
(
s
k
chain
,
dispute_id
∥
block_hash
)
(arbitrator,π 
vrf
​
 )=VRF(sk 
chain
​
 ,dispute_id∥block_hash)

Arbitration process:

Both parties submit evidence (encrypted, viewable only by arbitrator)
Arbitrator reviews and votes
For high-value disputes (
>
θ
panel
>θ 
panel
​
 ): panel of 3 arbitrators, majority decides
Decision is recorded on-chain; escrow released accordingly
Arbitrator incentives:

Arbitrators stake VIV
Correct decisions (agreed by super-majority in panel reviews) earn fees
Incorrect decisions lose stake
13. Data Storage Architecture
13.1 Storage Tiers
Tier	Location	Latency	Data Type
Hot	User's device (local SQLite/IndexedDB)	<1ms	Active memory, recent ACUs
Warm	User's chosen cloud (encrypted S3/B2)	~100ms	Full corpus, encrypted
Cold	IPFS (content-addressed)	~1s	Archival, published for sale
Chain	VIVIM blockchain	~3s	Commitments, consents, proofs only
13.2 Content-Addressed Storage
Every piece of data is addressed by its hash (IPFS CID model):

CID
(
E
a
)
=
Multibase
(
Multihash
(
H
(
E
a
)
)
)
CID(E 
a
​
 )=Multibase(Multihash(H(E 
a
​
 )))

This means:

Data integrity is built into the address (tamper-evident)
Deduplication is automatic (same content → same address)
Any storage backend can serve the data (no vendor lock-in)
13.3 Encryption-at-Rest Guarantee
Invariant: At no point does unencrypted ACU data exist outside the user's device memory.

text

User Device          Storage (any backend)         Blockchain
┌──────────┐        ┌──────────────────┐        ┌───────────┐
│ ACU (plain│───────►│ E_a = Enc(k_a,a)│        │ R_u (root)│
│ text)     │  enc   │ W_a = PKEnc(    │        │ H(E_a)    │
│           │        │   pk_u, k_a)    │        │           │
│ k_a (key) │        │                 │        │           │
│ sk_u      │        │ (never has k_a  │        │ (never has│
│           │        │  or sk_u)       │        │  any data)│
└──────────┘        └──────────────────┘        └───────────┘
14. Federation & Multi-Instance Architecture
14.1 VIVIM Instances
Any organization or individual can run a VIVIM instance. Instances federate via the open protocol:

Instance identity:
DID
instance
=
did:vivim:instance:
∥
Base58
(
H
(
p
k
instance
)
)
DID 
instance
​
 =did:vivim:instance:∥Base58(H(pk 
instance
​
 ))

Instance registration on-chain:
Tx
register
=
(
DID
instance
,
endpoint_url
,
capabilities
,
stake
,
σ
)
Tx 
register
​
 =(DID 
instance
​
 ,endpoint_url,capabilities,stake,σ)

14.2 Cross-Instance Data Portability
User 
u
u on instance 
I
1
I 
1
​
  migrates to instance 
I
2
I 
2
​
 :

Export: 
ExportBundle
=
(
MMR
u
,
{
E
a
}
a
∈
A
u
,
{
W
a
(
u
)
}
,
metadata
)
ExportBundle=(MMR 
u
​
 ,{E 
a
​
 } 
a∈A 
u
​
 
​
 ,{W 
a
(u)
​
 },metadata)
The bundle is self-contained — all data is encrypted under the user's key, not the instance's key
Import: 
I
2
I 
2
​
  receives the bundle, verifies 
R
u
R 
u
​
  against on-chain commitment
The on-chain state (consents, listings, reputation) follows the DID, not the instance
Mathematical guarantee: Because keys are user-held and data is encrypted under user keys, no instance can hold data hostage. The migration is a file transfer, not a permission request.

14.3 CRDT Synchronization
For users running VIVIM across multiple devices simultaneously, conflict-free replicated data types (CRDTs) ensure consistency:

ACU Addition CRDT (Grow-Only Set):
G
u
=
(
S
,
add
)
G 
u
​
 =(S,add)
add
(
G
u
,
a
)
=
G
u
∪
{
a
}
add(G 
u
​
 ,a)=G 
u
​
 ∪{a}
merge
(
G
u
,
1
,
G
u
,
2
)
=
G
u
,
1
∪
G
u
,
2
merge(G 
u,1
​
 ,G 
u,2
​
 )=G 
u,1
​
 ∪G 
u,2
​
 

ACU Metadata Update CRDT (Last-Writer-Wins Register):
LWW
(
a
.
meta
)
=
(
value
,
timestamp
)
LWW(a.meta)=(value,timestamp)
merge
(
LWW
1
,
LWW
2
)
=
arg
⁡
max
⁡
t
(
LWW
1
.
t
,
LWW
2
.
t
)
merge(LWW 
1
​
 ,LWW 
2
​
 )=argmax 
t
​
 (LWW 
1
​
 .t,LWW 
2
​
 .t)

Consent Set CRDT (2P-Set with tombstones):
ConsentSet
u
=
(
added
,
removed
)
ConsentSet 
u
​
 =(added,removed)
lookup
(
C
)
=
C
∈
added
∧
C
∉
removed
lookup(C)=C∈added∧C∈
/
removed

15. Security Analysis
15.1 Threat Model
Adversary	Capability	Mitigation
Curious Storage Provider	Reads stored data	All data encrypted; provider never has keys
Malicious Buyer	Wants more data than purchased	Per-ACU encryption; consent bounds access set
Compromised Proxy Node	Sees re-encryption traffic	PRE is semantically secure; proxy sees only ciphertexts
State Actor (Subpoena)	Legal demand for data	No central store has plaintext; user holds sole keys
Colluding Buyers	Combine purchases to infer more	Differential privacy bounds total information leakage
Sybil Attacker	Creates fake identities	Stake requirements; reputation requires diversity
Rogue Validator	Censors or reorders transactions	BFT consensus tolerates 
<
1
/
3
<1/3 Byzantine validators
Quantum Adversary (future)	Breaks ECDLP	Post-quantum key encapsulation (CRYSTALS-Kyber) as upgrade path
15.2 Formal Security Properties
Property 1: Data Confidentiality

∀
PPT adversary 
A
:
Pr
⁡
[
A
(
E
a
,
public_info
)
=
a
]
≤
negl
(
λ
)
∀PPT adversary A:Pr[A(E 
a
​
 ,public_info)=a]≤negl(λ)

Proof sketch: Reduces to IND-CCA2 security of AES-256-GCM for symmetric encryption and IND-CCA2 security of NaCl box for key encapsulation.

Property 2: Consent Integrity (Unforgeability)

∀
PPT adversary 
A
:
Pr
⁡
[
Verify
(
p
k
u
,
C
∗
,
σ
∗
)
=
1
∧
C
∗
∉
Signed
u
]
≤
negl
(
λ
)
∀PPT adversary A:Pr[Verify(pk 
u
​
 ,C 
∗
 ,σ 
∗
 )=1∧C 
∗
 ∈
/
Signed 
u
​
 ]≤negl(λ)

Proof sketch: Reduces to EUF-CMA security of Ed25519.

Property 3: Memory Integrity (Tamper Evidence)

Pr
⁡
[
VerifyInclusion
(
h
a
′
,
π
,
R
u
)
=
1
∧
a
′
∉
MMR
u
]
≤
negl
(
λ
)
Pr[VerifyInclusion(h 
a 
′
 
​
 ,π,R 
u
​
 )=1∧a 
′
 ∈
/
MMR 
u
​
 ]≤negl(λ)

Proof sketch: Reduces to collision resistance of BLAKE3.

Property 4: Privacy Composition Bound

After 
k
k aggregate sales with per-sale privacy 
ϵ
i
ϵ 
i
​
 :

Total privacy loss
≤
∑
i
=
1
k
ϵ
i
Total privacy loss≤∑ 
i=1
k
​
 ϵ 
i
​
 

And with advanced composition, for uniform 
ϵ
0
ϵ 
0
​
 :

Total privacy loss
≤
ϵ
0
2
k
ln
⁡
(
1
/
δ
)
+
k
ϵ
0
(
e
ϵ
0
−
1
)
Total privacy loss≤ϵ 
0
​
  
2kln(1/δ)
​
 +kϵ 
0
​
 (e 
ϵ 
0
​
 
 −1)

This is a provable bound on the total information any coalition of buyers can extract.

Property 5: Sovereign Exportability

∀
u
,
∀
t
:
Export
u
(
t
)
=
(
{
a
i
}
i
∈
[
n
]
,
keys
,
proofs
)
∀u,∀t:Export 
u
​
 (t)=({a 
i
​
 } 
i∈[n]
​
 ,keys,proofs)

Where 
Export
u
(
t
)
Export 
u
​
 (t) is computable using only 
s
k
u
sk 
u
​
  and the user's encrypted storage, with no cooperation required from any VIVIM instance, validator, or third party.

Proof: All data is encrypted under keys derived from 
seed
u
seed 
u
​
 . The MMR structure and all ACUs are stored in user-controlled storage. On-chain data (commitments, consents) is publicly readable. Therefore, the user can reconstruct their complete state independently. 
□
□

16. Protocol Governance
16.1 Governable Parameters
Parameter	Initial Value	Governance Control
Protocol fee 
α
α	2.5%	Token vote
Minimum validator stake	100,000 VIV	Token vote
Block time target	3 seconds	Token vote
Privacy budget default 
ϵ
default
ϵ 
default
​
 	1.0	Token vote
Arbitrator panel size	3	Token vote
ACU specification version	v1.0	RFC process + token vote
16.2 Upgrade Mechanism
Protocol upgrades follow a formal process:

VIP (VIVIM Improvement Proposal) published to governance forum
Reference implementation submitted as PR to open-source repo
Testnet deployment with 30-day evaluation period
Token vote with 7-day voting window, requiring:
Quorum: 
≥
10
%
≥10% of circulating supply votes
Threshold: 
≥
66.7
%
≥66.7% approval
Activation at specified block height
16.3 Constitutional Constraints
Certain properties are immutable — no governance vote can change them:

Users always control their own keys
Users can always export their data
Users can always revoke consent
The open-source core remains AGPL v3
No transaction can transfer data without a valid consent signature from the owner
These are enforced at the consensus level: validators reject blocks containing transactions that violate constitutional constraints.

17. Performance Characteristics
17.1 Computational Costs
Operation	Time	Where
ACU creation + encryption	~1ms	User device
MMR root update (append)	~0.1ms	User device
Merkle inclusion proof generation	
O
(
log
⁡
n
)
O(logn) ~0.5ms	User device
ZK proof generation (corpus property)	5–30 seconds	User device
ZK proof verification	~5ms	Blockchain validator
Consent transaction finality	~3 seconds	Blockchain
Key encapsulation for sale	~2ms per ACU	User device
PRE re-encryption	~5ms per ACU	Proxy node
17.2 Storage Costs
Component	Size	Growth Rate
Single ACU (typical)	2–50 KB	—
Encrypted ACU overhead	+44 bytes (GCM tag + nonce)	—
Merkle proof	
32
×
log
⁡
2
n
32×log 
2
​
 n bytes	Logarithmic
On-chain consent record	~500 bytes	Per transaction
ZK proof	~1 KB (PLONK)	Constant
Active user on-chain footprint	~2 KB (commitment + metadata)	Minimal
1 year of AI conversations (heavy user)	~50–500 MB (encrypted)	Linear
17.3 Blockchain Scalability
Metric	Value
Target TPS	1,000 consent operations/second
Block size	Adaptive, ~1 MB initial
State size	~100 bytes per registered user
Full node storage (1M users)	~10 GB chain data
Light client viability	Yes (Merkle proofs on state)
For scale beyond 1,000 TPS: sharding by user DID prefix, or L2 rollup for consent batching.

18. System Composition — Full Architecture Diagram
text

╔══════════════════════════════════════════════════════════════════════════╗
║                          USER DEVICE (SOVEREIGN)                        ║
║                                                                        ║
║  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ ║
║  │ KEY MANAGER │  │ ACU ENGINE   │  │ IMPORT       │  │ MARKETPLACE │ ║
║  │             │  │              │  │ PIPELINE     │  │ CLIENT      │ ║
║  │ seed_u      │  │ create       │  │              │  │             │ ║
║  │ sk_u, pk_u  │  │ classify     │  │ φ_openai     │  │ list        │ ║
║  │ HD derivatn │  │ encrypt      │  │ φ_claude     │  │ browse      │ ║
║  │ Shamir split│  │ MMR update   │  │ φ_gemini     │  │ sell        │ ║
║  │             │  │ embed        │  │ φ_cursor     │  │ buy         │ ║
║  │             │  │              │  │ φ_ollama     │  │ consent mgr │ ║
║  │             │  │              │  │ dedup        │  │ ZK prover   │ ║
║  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ ║
║         │                │                  │                 │        ║
║         └────────────────┴─────────┬────────┴─────────────────┘        ║
║                                    │                                    ║
║                          ┌─────────┴──────────┐                        ║
║                          │   LOCAL STORAGE     │                        ║
║                          │   (SQLite/IndexedDB)│                        ║
║                          │   All data encrypted│                        ║
║                          └─────────┬──────────┘                        ║
╚════════════════════════════════════╪════════════════════════════════════╝
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
  ┌───────────────────┐  ┌────────────────────┐  ┌──────────────────────┐
  │  ENCRYPTED CLOUD  │  │   IPFS / CONTENT   │  │   VIVIM BLOCKCHAIN   │
  │  STORAGE          │  │   ADDRESSED STORE  │  │                      │
  │                   │  │                    │  │  ┌──────────────────┐ │
  │  User's S3/B2     │  │  Marketplace       │  │  │ Consensus Layer │ │
  │  Full corpus      │  │  delivery          │  │  │ Tendermint BFT  │ │
  │  (encrypted)      │  │  (encrypted pkgs)  │  │  └────────┬─────────┘│
  │                   │  │                    │  │           │          │
  │  No keys stored   │  │  Content-addressed │  │  ┌────────┴─────────┐│
  │  here ever        │  │  Tamper-evident    │  │  │ State Machine    ││
  │                   │  │                    │  │  │                  ││
  └───────────────────┘  └────────────────────┘  │  │ • Identity       ││
                                                  │  │ • MemoryCommit   ││
                                                  │  │ • Consent        ││
                                                  │  │ • Marketplace    ││
                                                  │  │ • Token/Escrow   ││
                                                  │  │ • Governance     ││
                                                  │  │ • Disputes       ││
                                                  │  └──────────────────┘│
                                                  │                      │
                                                  │  ┌──────────────────┐│
                                                  │  │ ZK Verifier      ││
                                                  │  │ (PLONK verifier  ││
                                                  │  │  on-chain)       ││
                                                  │  └──────────────────┘│
                                                  └──────────────────────┘
19. Formal Protocol Specification — Key Algorithms
19.1 Algorithm: ImportAndUnify
text

INPUT:  User u, Provider export files {F_p}_{p ∈ P}
OUTPUT: Updated MMR_u, updated R_u on-chain

1.  FOR each provider p:
2.      A_p ← φ_p(F_p)                          // Parse export
3.      FOR each ACU a ∈ A_p:
4.          a.id ← H(a.body ‖ a.ts ‖ DID_u)     // Deterministic ID
5.          C(a) ← Classify(a)                    // Topic, sensitivity, depth
6.          e(a) ← Embed(a)                       // Vector embedding
7.          k_a ←$ {0,1}^256                      // Fresh symmetric key
8.          E_a ← AES-GCM(k_a, Serialize(a))     // Encrypt
9.          W_a ← PKEnc(pk_u, k_a)               // Wrap key
10.         Store(E_a, W_a) to local + cloud      // Persist
11.         MMR_u.append(H(a))                    // Add to Merkle structure
12. 
13. // Cross-provider deduplication
14. FOR each pair (a_i, a_j) where a_i.prov ≠ a_j.prov:
15.     IF sim(e(a_i), e(a_j)) > θ_dedup:
16.         Link(a_i, a_j) in DAG                 // Mark as related
17.
18. R_u ← MMRRoot(MMR_u)                         // Compute new root
19. Tx ← Sign(sk_u, (DID_u, R_u, |MMR_u|, stats))
20. Submit Tx to blockchain                       // Commit on-chain
19.2 Algorithm: CreateListing
text

INPUT:  User u, ACU selection criteria S, price floor P_min, 
        permissions offered P_vec
OUTPUT: Marketplace listing with ZK proof

1.  L ← SelectACUs(MMR_u, S)                     // Filter ACUs matching criteria
2.  
3.  // Generate ZK proof of data properties
4.  π ← ZKProve(
5.      witness: (MMR_u, L, {a ∈ L}),
6.      statement: (
7.          R_u,                                   // Committed root
8.          |L| ≥ N_min,                           // Minimum count
9.          Topics(L) ⊇ required_topics,           // Topic coverage
10.         Freshness(L, δ),                       // Recency
11.         Providers(L) ⊇ required_providers      // Provider coverage
12.     )
13. )
14.
15. D ← (topic_categories, |L|, provider_set,     // Public descriptor
16.       freshness_range, depth_stats)
17.
18. listing_id ← H(DID_u ‖ D ‖ nonce)
19. Tx ← Sign(sk_u, (DID_u, listing_id, D, P_min, P_vec, π))
20. Submit Tx to blockchain
19.3 Algorithm: ExecuteSale
text

INPUT:  Seller u, Buyer b, Listing listing_id, Agreed price P
OUTPUT: Encrypted data delivery, on-chain consent, payment

// BUYER SIDE:
1.  Tx_purchase ← Sign(sk_b, (DID_b, listing_id, P))
2.  Submit Tx_purchase with P tokens to escrow contract

// SELLER SIDE (after reviewing buyer):
3.  IF AcceptBuyer(b, ρ_b, listing_terms):
4.      // Generate consent record
5.      C ← (id_C, DID_u, DID_b, L, P_vec, T, Δ, P, nonce)
6.      σ_C ← Sign(sk_u, H(C))
7.      Tx_consent ← (C, σ_C)
8.      Submit Tx_consent to blockchain
9.      
10.     // Prepare encrypted delivery package
11.     k_bundle ←$ {0,1}^256
12.     FOR each a_i ∈ L:
13.         k_i ← Decrypt(sk_u, W_{a_i})          // Recover ACU key
14.         W_i^(bundle) ← Enc(k_bundle, k_i)     // Re-wrap under bundle key
15.     W_bundle^(b) ← PKEnc(pk_b, k_bundle)      // Wrap bundle key for buyer
16.     
17.     Package ← (W_bundle^(b), {(h_{a_i}, W_i^(bundle), E_{a_i})}_{a_i ∈ L})
18.     CID ← Upload(Package) to IPFS
19.     
20.     Tx_fulfill ← Sign(sk_u, (id_C, CID, H(Package)))
21.     Submit Tx_fulfill to blockchain

// BUYER SIDE (verification):
22. Download Package from CID
23. k_bundle ← PKDec(sk_b, W_bundle^(b))
24. FOR each (h_{a_i}, W_i^(bundle), E_{a_i}):
25.     k_i ← Dec(k_bundle, W_i^(bundle))
26.     a_i ← AES-GCM-Dec(k_i, E_{a_i})
27.     VERIFY: H(Serialize(a_i)) = h_{a_i}        // Integrity check
28.     VERIFY: MerkleProof(h_{a_i}, R_u) = true    // Inclusion check
29.
30. IF all verifications pass:
31.     Tx_confirm ← Sign(sk_b, (id_C, "CONFIRMED"))
32.     Submit Tx_confirm → escrow releases P×(1-α) to seller
33. ELSE:
34.     Tx_dispute ← Sign(sk_b, (id_C, "DISPUTE", evidence))
35.     Submit Tx_dispute → enters arbitration
19.4 Algorithm: RevokeConsent
text

INPUT:  User u, Consent ID id_C
OUTPUT: On-chain revocation, key invalidation

1.  VERIFY: Consent C with id_C exists and status = ACTIVE
2.  VERIFY: C.u = DID_u                          // Only owner can revoke
3.  
4.  Tx_revoke ← Sign(sk_u, (id_C, t_now, "REVOKED"))
5.  Submit Tx_revoke to blockchain
6.  
7.  // Invalidate re-encryption keys (if PRE was used)
8.  FOR each proxy node holding rk_{u→b}:
9.      SendRevocation(proxy, id_C)
10.     proxy.delete(rk_{u→b} for scope L)
11.
12. // Key rotation: generate new keys for affected ACUs
13. FOR each a_i ∈ C.L:
14.     k_i' ←$ {0,1}^256                        // Fresh key
15.     E_{a_i}' ← AES-GCM(k_i', a_i)           // Re-encrypt
16.     W_{a_i}' ← PKEnc(pk_u, k_i')             // Re-wrap
17.     Replace(E_{a_i}, E_{a_i}') in storage
18.     // Old ciphertext E_{a_i} is no longer decryptable with new key
19.
20. // Update MMR (hashes don't change, only ciphertexts)
21. // R_u remains valid — data identity unchanged
20. Integration with VIVIM Open Core
20.1 Mapping to the Seven Pillars
Blockchain Component	VIVIM Pillar	Integration Point
ACU encryption & Merkle DAG	Pillar 1: ACU Spec & Context Engine	ACUs gain crypto identity + integrity proofs
Provider parsers → ACU chain	Pillar 2: Provider Import	Imports now produce chain-committed ACUs
DID + key management	Pillar 3: Identity & Portability	DIDs become blockchain-anchored sovereign IDs
Federation + P2P	Pillar 4: Network & Federation	Federation gains economic layer (marketplace)
SDK marketplace bindings	Pillar 5: SDK & Developer Toolkit	Developers can build marketplace UIs
Self-hosted full stack	Pillar 6: Self-Hosted Stack	Full node = VIVIM instance + blockchain light client
MCP + integrations	Pillar 7: Community Integrations	AI tools can query marketplace for context
20.2 Open Core Boundary for Blockchain Components
Open (AGPL v3):

All cryptographic primitives (encryption, ZK circuits, PRE)
ACU chain serialization and Merkle structures
Consent record format and validation logic
Blockchain node software (consensus, state machine)
SDK for marketplace interaction
Privacy budget accounting
ZK proof generation library
Local key management
Commercial (VIVIM Cloud):

Managed blockchain RPC endpoints with SLAs
Managed proxy re-encryption node fleet
Managed ZK proof generation (cloud GPU acceleration)
Compliance-certified marketplace interface
Enterprise bulk import with managed key ceremony
White-glove data listing optimization
Institutional buyer verification and KYB
21. Migration Path
Phase 1: Foundation (Months 1–6)
Deploy ACU encryption + Merkle commitment on testnet
Implement per-ACU key management in VIVIM client
Build consent record data structure and validation
ZK circuit for basic corpus property proofs
Phase 2: Marketplace Alpha (Months 7–12)
Launch VIVIM chain mainnet (validator set from early stakers)
Marketplace listing and purchase flow (Level 0 and Level 1 sales only)
Basic reputation system
Privacy budget accounting
Phase 3: Full Marketplace (Months 13–18)
All granularity levels (Level 0–4)
PRE streaming access
Advanced ZK proofs (topic coverage, freshness, quality)
Dispute resolution and arbitration
IBC bridge to Ethereum for VIV liquidity
Phase 4: Ecosystem Scale (Months 19–24)
Third-party marketplace frontends via SDK
Enterprise buyer verification program
Aggregate data cooperatives (users pool data for collective bargaining)
Cross-chain interoperability
Post-quantum key migration option
22. Summary of Mathematical Guarantees
Property	Guarantee	Mechanism
You own your data	Only your key can decrypt your ACUs	AES-256-GCM + user-held keys
No one can forge your consent	Consent requires your signature	Ed25519 EUF-CMA security
Your data hasn't been tampered with	Merkle root committed on-chain	BLAKE3 collision resistance
Buyers can verify data properties without seeing data	ZK proofs of corpus properties	PLONK zero-knowledge soundness
Total information leakage is bounded	Privacy budget composition	
(
ϵ
,
δ
)
(ϵ,δ)-differential privacy
You can leave anytime	Data encrypted under your key, exportable	Sovereign key architecture
Consent is revocable	On-chain revocation + key rotation + PRE invalidation	Protocol-enforced state machine
Marketplace is fair	Escrow + automated verification + arbitration	Smart contract + BFT consensus
The protocol itself is trustworthy	All code is open source, all rules are on-chain	AGPL v3 + constitutional constraints
The mathematics does not ask for your trust. It earns it through proof.

Architecture version: 1.0
Authors: VIVIM Protocol Team
License: This specification is released under CC-BY-SA 4.0
Reference implementation: AGPL v3s
