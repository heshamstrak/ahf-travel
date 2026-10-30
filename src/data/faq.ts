export interface FaqCategory {
  id: string;
  title: string;
  items: { question: string; answer: string }[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: "bookings",
    title: "Bookings",
    items: [
      {
        question: "How do I book a trip on AHF Travel?",
        answer: "Search for a hotel, tour, car, transfer or package, choose your option, then continue to checkout. You will receive a booking reference and voucher by email.",
      },
      {
        question: "Can I combine a hotel, tour and transfer in one order?",
        answer: "Yes. Book each item separately, or choose a travel package that bundles them. Each item keeps its own confirmation and cancellation terms.",
      },
      {
        question: "Where can I find my booking?",
        answer: "Open My Bookings from the top menu. Each booking has its status, details and a downloadable voucher.",
      },
    ],
  },
  {
    id: "hotels",
    title: "Hotels",
    items: [
      {
        question: "What time is check-in and check-out?",
        answer: "Check-in is usually from 14:00 and check-out is by 12:00. Early check-in or late check-out can be requested through the hotel after booking.",
      },
      {
        question: "Do the prices include taxes?",
        answer: "Prices shown on the checkout summary include VAT and a mock service fee. Final taxes are confirmed on your voucher.",
      },
    ],
  },
  {
    id: "tours",
    title: "Tours",
    items: [
      {
        question: "Are tours private or shared?",
        answer: "Most tours are shared with a small group up to the maximum group size listed on each tour page.",
      },
      {
        question: "Do I need to bring my passport?",
        answer: "Yes. Bring your passport for entry to archaeological sites and for hotel check-in.",
      },
    ],
  },
  {
    id: "cars",
    title: "Cars",
    items: [
      {
        question: "What do I need to rent a car?",
        answer: "A valid passport, a driving licence held for at least two years, and a credit card for the security deposit. Minimum age is 21.",
      },
      {
        question: "How does the fuel policy work?",
        answer: "Most rentals are full-to-full. Collect the car with a full tank and return it full to avoid refuelling charges.",
      },
    ],
  },
  {
    id: "transfers",
    title: "Transfers",
    items: [
      {
        question: "Will my driver wait if my flight is late?",
        answer: "Yes. Flight tracking adjusts the pick-up time automatically, and waiting time is included for the first hour.",
      },
      {
        question: "Can I request a child seat?",
        answer: "Child seats can be requested in the transfer notes at checkout. Availability is confirmed by email.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        question: "Which payment methods do you accept?",
        answer: "Visa, Mastercard and Meeza cards are accepted. Some products also offer Pay Later, paid at pick-up or check-in.",
      },
      {
        question: "Is my payment secure?",
        answer: "All payments are processed through a PCI-compliant gateway. Card details are never stored on this website. (The payment gateway is not connected yet in this preview.)",
      },
    ],
  },
  {
    id: "cancellations",
    title: "Cancellations",
    items: [
      {
        question: "How do I cancel a booking?",
        answer: "Open the booking from My Bookings and choose Cancel Booking. The cancellation policy for each product is shown before you confirm.",
      },
      {
        question: "When will I receive my refund?",
        answer: "Eligible refunds are returned to the original payment method within 7 to 14 business days.",
      },
    ],
  },
];
