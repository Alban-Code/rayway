-- Quantité d'une carte dans un deck : entre 1 et 4
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_quantity_check" 
  CHECK (quantity >= 1 AND quantity <= 4);

-- Taille maximale d'un deck : 50 cartes (somme des quantités)
CREATE OR REPLACE FUNCTION check_deck_size()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COALESCE(SUM(quantity), 0) + NEW.quantity
    FROM "DeckCard"
    WHERE "deckId" = NEW."deckId"
    AND id != COALESCE(NEW.id, -1)
  ) > 50 THEN
    RAISE EXCEPTION 'Un deck ne peut pas dépasser 50 cartes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "DeckCard_deck_size_check"
  BEFORE INSERT OR UPDATE ON "DeckCard"
  FOR EACH ROW EXECUTE FUNCTION check_deck_size();