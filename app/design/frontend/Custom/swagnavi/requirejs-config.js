var config = {
    paths: {
        'fotorama/fotorama': 'fotorama/fotorama',
        'mage/gallery/gallery': 'mage/gallery/gallery'
    },
    shim: {
        'fotorama/fotorama': {
            deps: ['jquery']
        },
        'mage/gallery/gallery': {
            deps: ['fotorama/fotorama']
        }
    }
}