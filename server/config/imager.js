/**
 * Config Imager
 */

module.exports = {
	variants: {
		blog: {
			resize: {
				mini: '300x200',
				preview: '800x600'
			},
			crop: {
        		thumb: "400x400 Center"
			},
			/*resizeAndCrop: {
				large: {
					resize: '1000x1000',
					crop: '900x900'
				}
			}*/
		},
		product: {
			keepNames: true,
			resize: {
				// mini: '300x200',
				original: "100%"
			}
		},

	    gallery: {
	      crop: {
	        thumb: '100x100'
	      }
	    }
	},

	storage: {
		Local: {
			provider: 'local',
			path: 'client/img',
			mode: 0777
		}
	},

  	debug: false
}