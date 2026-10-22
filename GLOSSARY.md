# Salsala

A small boutique's storefront: customers pick products into a basket and send the order to the owner, who then prepares it.

## Language

**Product**:
An item the shop sells, with a name, price and photos. Only available products are shown to customers.
_Avoid_: Item (on its own), SKU

**Basket**:
The customer's in-progress selection of products and quantities, before it is sent. It is not yet known to the owner.
_Avoid_: Cart, Order (before sending)

**Order**:
A basket the customer has sent, together with who sent it, or an order the owner entered herself for a customer who ordered by phone or chat. It is what the owner sees and prepares.
_Avoid_: Basket (after sending), Purchase

**Order number**:
A short number that counts up, given to every order and shown in the customer's message, so the owner can match a chat to a saved order.
_Avoid_: Order ID, Reference

**Order line**:
One product in an order with its quantity, keeping the product's name and price as they were when the order was sent.
_Avoid_: Item, Row

**Bake day**:
A weekday on which the owner bakes and customers pick up. Orders can only be due on a bake day.
_Avoid_: Delivery day, Work day

**Due date**:
The bake day on which the customer picks up the order. Chosen by the customer before the cutoff.
_Avoid_: Order date (that is when it was placed), Delivery date

**Cutoff**:
The last moment orders are accepted for a given bake day.
_Avoid_: Deadline

**Pickup**:
The customer collects the order from the owner on its due date. There is no delivery.
_Avoid_: Delivery, Shipping

**Paid**:
Whether the customer has paid for the order. Independent of order status.
_Avoid_: Settled, Closed

**Order status**:
Where an order stands: new (sent, not yet handled), confirmed (owner agreed with the customer), ready (prepared), or cancelled. Cancelled orders don't count in summaries.
_Avoid_: State, Done

**Note**:
Free text the customer adds to an order, such as a dedication or an allergy.
_Avoid_: Comment, Remarks

**Customer**:
The person who sends an order, identified by name and phone number. There are no customer accounts.
_Avoid_: User, Client

**Owner**:
The person running the shop who receives, prepares and tracks orders through the admin area.
_Avoid_: Admin (as a person), Seller

**Day sheet**:
The owner's view of every order due on one bake day: the bake list, each customer's order with its total and paid state, and the day's grand total. Replaces one sheet of her Excel file.
_Avoid_: Daily summary, Report, Dashboard

**Bake list**:
The total quantity of each product across a day sheet's orders, meaning what to bake.
_Avoid_: Production list, Totals row
