#!/bin/bash

# Create a backup of the file
cp server/database-storage.ts server/database-storage.ts.bak

# Fix all delete methods with "result.count > 0" pattern
sed -i 's/const result = await db.delete(\([^)]*\)).where(\([^)]*\));\n    return result.count > 0;/await db.delete(\1).where(\2);\n    return true;/g' server/database-storage.ts

echo "Fixed delete methods in database-storage.ts"
