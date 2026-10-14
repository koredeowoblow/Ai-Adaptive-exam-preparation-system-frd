export type SymbolCategoryId = 
  | 'basic'
  | 'calculus'
  | 'greek'
  | 'physics_chem'
  | 'logic_sets';

export interface SymbolCategory {
  id: SymbolCategoryId;
  label: string;
  shortLabel: string;
}

export const SYMBOL_CATEGORIES: SymbolCategory[] = [
  { id: 'basic', label: 'Basic & Algebra', shortLabel: 'Basic' },
  { id: 'calculus', label: 'Calculus & Functions', shortLabel: 'Calculus' },
  { id: 'greek', label: 'Greek & Constants', shortLabel: 'Greek' },
  { id: 'physics_chem', label: 'Physics & Chemistry', shortLabel: 'Sci & Chem' },
  { id: 'logic_sets', label: 'Logic & Sets', shortLabel: 'Logic' },
];

export interface MathSymbolItem {
  label: string;
  desc: string;
  insert: string;
  isTemplate?: boolean;
  templateType?: 
    | 'sqrt' 
    | 'fraction' 
    | 'power_square' 
    | 'power_n' 
    | 'power_10n'
    | 'chem' 
    | 'integral_bounds' 
    | 'integral_simple'
    | 'derivative' 
    | 'partial_derivative'
    | 'sum' 
    | 'limit' 
    | 'log' 
    | 'ln' 
    | 'plain_math';
  category: SymbolCategoryId;
}

export const MATH_SYMBOLS: MathSymbolItem[] = [
  // 1. Basic: + − ± × ÷ = ≠ ≈ x² xⁿ √x a/b
  { label: '+', desc: 'Plus', insert: '+', category: 'basic' },
  { label: '−', desc: 'Minus', insert: '−', category: 'basic' },
  { label: '±', desc: 'Plus-minus', insert: '±', category: 'basic' },
  { label: '×', desc: 'Multiply', insert: '×', category: 'basic' },
  { label: '÷', desc: 'Divide', insert: '÷', category: 'basic' },
  { label: '=', desc: 'Equals', insert: '=', category: 'basic' },
  { label: '≠', desc: 'Not equal', insert: '≠', category: 'basic' },
  { label: '≈', desc: 'Approximately equal', insert: '≈', category: 'basic' },
  { label: 'x²', desc: 'Square', insert: 'x^2', isTemplate: true, templateType: 'power_square', category: 'basic' },
  { label: 'xⁿ', desc: 'Power', insert: 'x^{n}', isTemplate: true, templateType: 'power_n', category: 'basic' },
  { label: '√x', desc: 'Square root', insert: '\\sqrt{x}', isTemplate: true, templateType: 'sqrt', category: 'basic' },
  { label: 'a/b', desc: 'Fraction', insert: '\\frac{a}{b}', isTemplate: true, templateType: 'fraction', category: 'basic' },

  // 2. Calculus and Algebra: d/dx, ∂/∂x, \int, \int_a^b, \sum, \lim, \infty, \ln, \log
  { label: 'd/dx', desc: 'Derivative', insert: '\\frac{d}{dx}', isTemplate: true, templateType: 'derivative', category: 'calculus' },
  { label: '∂/∂x', desc: 'Partial derivative', insert: '\\frac{\\partial}{\\partial x}', isTemplate: true, templateType: 'partial_derivative', category: 'calculus' },
  { label: '∫', desc: 'Indefinite integral', insert: '\\int ', isTemplate: true, templateType: 'integral_simple', category: 'calculus' },
  { label: '∫ₐᵇ', desc: 'Definite integral', insert: '\\int_{a}^{b} ', isTemplate: true, templateType: 'integral_bounds', category: 'calculus' },
  { label: '∑', desc: 'Summation', insert: '\\sum_{i=1}^{n} ', isTemplate: true, templateType: 'sum', category: 'calculus' },
  { label: 'lim', desc: 'Limit', insert: '\\lim_{x \\to 0} ', isTemplate: true, templateType: 'limit', category: 'calculus' },
  { label: '∞', desc: 'Infinity', insert: '\\infty', isTemplate: true, templateType: 'plain_math', category: 'calculus' },
  { label: 'ln', desc: 'Natural logarithm', insert: '\\ln()', isTemplate: true, templateType: 'ln', category: 'calculus' },
  { label: 'log', desc: 'Logarithm', insert: '\\log()', isTemplate: true, templateType: 'log', category: 'calculus' },

  // 3. Greek and Constants: α β γ θ λ π μ σ ω Ω Δ ε ρ
  { label: 'α', desc: 'Alpha', insert: 'α', category: 'greek' },
  { label: 'β', desc: 'Beta', insert: 'β', category: 'greek' },
  { label: 'γ', desc: 'Gamma', insert: 'γ', category: 'greek' },
  { label: 'θ', desc: 'Theta', insert: 'θ', category: 'greek' },
  { label: 'λ', desc: 'Lambda', insert: 'λ', category: 'greek' },
  { label: 'π', desc: 'Pi', insert: 'π', category: 'greek' },
  { label: 'μ', desc: 'Mu', insert: 'μ', category: 'greek' },
  { label: 'σ', desc: 'Sigma', insert: 'σ', category: 'greek' },
  { label: 'ω', desc: 'Omega (lowercase)', insert: 'ω', category: 'greek' },
  { label: 'Ω', desc: 'Omega (capital)', insert: 'Ω', category: 'greek' },
  { label: 'Δ', desc: 'Delta (capital)', insert: 'Δ', category: 'greek' },
  { label: 'ε', desc: 'Epsilon', insert: 'ε', category: 'greek' },
  { label: 'ρ', desc: 'Rho', insert: 'ρ', category: 'greek' },

  // 4. Physics and Chemistry: °, Ω, ⇌, →, ↑, ↓, m/s², kg, 10^n, \ce{}
  { label: '°', desc: 'Degree', insert: '°', category: 'physics_chem' },
  { label: 'Ω', desc: 'Ohm', insert: 'Ω', category: 'physics_chem' },
  { label: '⇌', desc: 'Equilibrium', insert: '⇌', category: 'physics_chem' },
  { label: '→', desc: 'Reaction arrow', insert: '→', category: 'physics_chem' },
  { label: '↑', desc: 'Gas release', insert: '↑', category: 'physics_chem' },
  { label: '↓', desc: 'Precipitate', insert: '↓', category: 'physics_chem' },
  { label: 'm/s²', desc: 'Acceleration unit', insert: 'm/s²', category: 'physics_chem' },
  { label: 'kg', desc: 'Kilogram unit', insert: 'kg', category: 'physics_chem' },
  { label: '10ⁿ', desc: 'Scientific notation (10ⁿ)', insert: '10^{n}', isTemplate: true, templateType: 'power_10n', category: 'physics_chem' },
  { label: '\\ce{}', desc: 'Chemical equation (mhchem)', insert: '\\ce{}', isTemplate: true, templateType: 'chem', category: 'physics_chem' },

  // 5. Logic and Sets: ∈ ∉ ∀ ∃ ∪ ∩ ⇒ ⇔
  { label: '∈', desc: 'Element of', insert: '∈', category: 'logic_sets' },
  { label: '∉', desc: 'Not element of', insert: '∉', category: 'logic_sets' },
  { label: '∀', desc: 'For all', insert: '∀', category: 'logic_sets' },
  { label: '∃', desc: 'There exists', insert: '∃', category: 'logic_sets' },
  { label: '∪', desc: 'Union', insert: '∪', category: 'logic_sets' },
  { label: '∩', desc: 'Intersection', insert: '∩', category: 'logic_sets' },
  { label: '⇒', desc: 'Implies', insert: '⇒', category: 'logic_sets' },
  { label: '⇔', desc: 'If and only if', insert: '⇔', category: 'logic_sets' },
];
