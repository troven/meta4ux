
def data = [:]
models.each { k, crud ->
    data[k] = crud.read([:]).size()
}

return [
        models: data
]