const store = { users: [], sessions: []};
const nextId = {users: 1, sessions: 1};

const notFound = {code: 'PGRST116', message: 'Results contain 0 rows'};

class QueryBuilder {
    constructor(table){
        if(!store[table]) throw new Error(`testDb: unsupported table "${table}"`);
        this.table = table;
        this._filters = [];
        this._op = null;
    }

    select() {return this;}
insert(payload) {this._op = {kind: 'insert', payload};
return this;}
update(payload) {this._op = {kind: 'update', payload};
return this;}

eq(column, value){
    this._filters.push((row)=>String(row[column])===String(value));
    return this;
}

_resolveRows(){
const rows = store[this.table];

if (this._op && this._op.kind === 'insert'){
const row = {id: nextId[this.table]++,...this._op.payload}; 
if(this.table === 'users' && row.classes === undefined) row.classes = [];
rows.push(row);
return[row];
}

const matched = rows.filter((row)=> this._filters.every((f) => f(row)));
if(this._op && this._op.kind === 'update'){
    matched.forEach((row)=> Object.assign(row, this._op.payload));
}
return matched;
}

then(resolve, reject){
try{resolve({data: this._resolveRows(), error: null});
}
catch(err){reject(err);}

}

async single(){
const rows = this._resolveRows();
return rows.length === 0 ? {data: null, error: notFound}
: {data: rows[0], error: null};
}
}

module.exports = {from:(table)=> new QueryBuilder(table)};