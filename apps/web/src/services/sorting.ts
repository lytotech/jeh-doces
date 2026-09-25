const nameCollator = new Intl.Collator('pt-BR', {
  sensitivity: 'base',
  numeric: true,
});

export const compareNames = (left: string, right: string) => nameCollator.compare(left, right);

export const sortByName = <T extends { name: string }>(items: T[]) =>
  [...items].sort((left, right) => compareNames(left.name, right.name));
