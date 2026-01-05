export const menu = {
  pizzas: {
    regular: [
      {
        name: "1 Toppings Pizza",
        prices: { medium: "13.99", large: "16.99" },
        description: "Choose one topping from our selection",
        image: "/images/pizza1.jpg"
      },
      {
        name: "2 Toppings Pizza",
        prices: { medium: "14.99", large: "17.99" },
        description: "Choose two toppings from our selection",
        image: "/images/pizza2.jpg"
      },
      {
        name: "3 Toppings Pizza",
        prices: { medium: "15.99", large: "18.99" },
        description: "Choose three toppings from our selection",
        image: "/images/pizza3.jpg"
      },
    ],
    specialty: [
      {
        name: "Supreme Pizza",
        price: "22.99",
        description: "Pepperoni, sausage, onions, peppers, olives",
        image: "/images/pizza4.jpg",
        predefinedToppings: ["Pepperoni","Ham","Bacon","Mushroom", "Sausage", "Onions", "Green Peppers", "Black Olives"]
      },
      {
        name: "Deluxe Pizza",
        price: "22.99",
        description: "Pepperoni, sausage, onions, peppers, olives",
        image: "/images/pizza4.jpg",
        predefinedToppings: ["Pepperoni", "Sausage", "Onions", "Green Peppers", "Black Olives"]
      },
      {
        name: "Chicken Bacon Ranch",
        price: "22.99",
        description: "Grilled chicken, bacon, and ranch",
        image: "/images/pizza1.jpg"
      },
      {
        name: "BLT Pizza",
        prices: { medium: "17.99", large: "22.99" },
        description: "Bacon, lettuce & tomato",
        image: "/images/pizza2.jpg"
      },
      {
        name: "Philly Steak Pizza",
        prices: { medium: "17.99", large: "22.99" },
        description: "Steak, peppers, onions, and cheese",
        image: "/images/pizza3.jpg"
      },
      {
        name: "The Big Pig Pizza",
        price: "22.99",
        description: "All meat pizza",
        image: "/images/pizza3.jpg"
      },
      {
        name: "Breakfast Pizza",
        price: "22.99",
        description: "Bacon, ham, sausage & eggs",
        image: "/images/pizza4.jpg"
      },
      {
        name: "BBQ Chicken",
        price: "22.99",
        description: "Chicken with BBQ sauce",
        image: "/images/pizza1.jpg"
      },
      {
        name: "Hawaiian Pizza",
        price: "22.99",
        description: "Bacon, ham, pineapple",
        image: "/images/pizza2.jpg"
      },
    ],
  },
  sides: [
    {
      name: "Cheesy Bread",
      prices: { medium: "11.99", large: "13.99" },
      description: '14" or 16"',
      image: "/images/pizza1.jpg"
    },
    {
      name: "French Fries",
      price: "4.99",
      image: "/images/frenchfries.jpg"
    },
    {
      name: "Onion Rings",
      price: "4.99",
      image: "/images/onionrings.jpg"
    },
    {
      name: "Mushrooms (12)",
      price: "6.99",
      image: "/images/mushroom.jpg"
    },
    {
      name: "Jalapeno Poppers (6)",
      price: "5.99",
      image: "/images/pizza1.jpg"
    },
    {
      name: "Mozzarella Sticks (5)",
      price: "7.99",
      image: "/images/mozarellasticks.jpg"
    },
    {
      name: "Mini Tacos (12)",
      price: "6.99",
      image: "/images/minitacos.jpg"
    },
    {
      name: "MacNCheese Bites",
      price: "6.99",
      image: "/images/pizza1.jpg"
    },
  ],
  chicken: [
    {
      name: "Chicken Strips (4) w/ff",
      price: "7.99",
      image: "/images/chickenstrips.jpg"
    },
    {
      name: "Original Chicken Drummies (6)",
      price: "7.99",
      image: "/images/pizza1.jpg"
    },
    {
      name: "Original Chicken Drummies (12)",
      price: "12.99",
      image: "/images/pizza2.jpg"
    },
    {
      name: "Flavored Chicken Drummies",
      price: "13.99",
      description: "Hot, BBQ, Garlic Parmesan, or Teriyaki",
      image: "/images/pizza3.jpg"
    },
  ],
  subs: [
    {
      name: "Ham & Cheese Sub",
      price: "10.99",
      image: "/images/subs.jpg"
    },
    {
      name: "Italian Sub",
      price: "10.99",
      description: "Ham, Salami, Pepperoni & cheese",
      image: "/images/subs2.jpg"
    },
    {
      name: "Turkey & Cheese Sub",
      price: "10.99",
      image: "/images/subs3.jpg"
    },
    {
      name: "Pizza Sub",
      price: "10.99",
      description: "Pepperoni, Ham & Cheese",
      image: "/images/subs4.jpg"
    },
  ],
  deliSalads: [
    {
      name: "Pickle Bologna/Salami & Cheese",
      price: "5.99",
      image: "/images/delisalads.jpg"
    },
    {
      name: "Macaroni Salad",
      price: "5.99",
      image: "/images/deli2.jpg"
    },
    {
      name: "Cole Slaw",
      price: "5.99",
      image: "/images/deli3.jpg"
    },
    {
      name: "Chicken Salad",
      price: "5.99",
      image: "/images/deli4.jpg"
    },
    {
      name: "Tropical Fruit Salad",
      price: "5.99",
      image: "/images/deli6.jpg"
    },
    {
      name: "Potato Salad",
      price: "5.99",
      image: "/images/deli5.jpg"
    },
  ],
  burgers: [
    {
      name: "Cheeseburger",
      price: "8.99",
      image: "/images/burger.jpg",
      addOns: {
        "Fries": "1.99",
        "Bacon": "1.99"
      }
    },
  ],
  specials: [
    {
      name: "Family Meal Deal",
      price: "29.99",
      description:
        "Large 3 topping pizza & 14in cheesy bread plus a Faygo 2 liter",
      image: "/images/familymeal.png"
    },
    {
      name: "Lunch Special",
      price: "6.49",
      description: "2 slices of pizza and a 32oz fountain pop",
      image: "/images/lunchspcl.png",
    },
  ],
};

export const toppings = [
  "Ham",
  "Pepperoni",
  "Bacon",
  "Sausage",
  "Green Olives",
  "Black Olives",
  "Mild Peppers",
  "Green Peppers",
  "Mushrooms",
  "Onions",
  "Pineapple",
  "Lettuce",
  "Tomato",
  "Grilled Chicken",
  "Jalapeño Peppers",
  "Fries",
];

