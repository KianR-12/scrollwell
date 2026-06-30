export interface Book {
  title: string
  author: string
  year: number
  pages: number
  isbn: string
  category: string
}

export const BOOKS: Book[] = [
  { title: 'Atomic Habits',            author: 'James Clear',        year: 2018, pages: 320, isbn: '9780735211292', category: 'Entrepreneurship' },
  { title: 'Thinking, Fast and Slow',  author: 'Daniel Kahneman',    year: 2011, pages: 499, isbn: '9780374533557', category: 'Psychology'       },
  { title: 'Sapiens',                  author: 'Yuval Noah Harari',  year: 2011, pages: 443, isbn: '9780062316097', category: 'History'           },
  { title: 'The Lean Startup',         author: 'Eric Ries',          year: 2011, pages: 299, isbn: '9780307887894', category: 'Entrepreneurship' },
  { title: "Man's Search for Meaning", author: 'Viktor Frankl',      year: 1946, pages: 165, isbn: '9780807014271', category: 'Philosophy'       },
  { title: 'The Psychology of Money',  author: 'Morgan Housel',      year: 2020, pages: 256, isbn: '9780857197689', category: 'Finance'          },
]
