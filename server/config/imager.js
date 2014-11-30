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
				// thumb: '200x200',
        		thumb_center: "400x400 Center"
			},
			resizeAndCrop: {
				large: {
					resize: '1000x1000',
					crop: '900x900'
				}
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
			path: 'client/images',
			mode: 0777
		}
	},

  	debug: true
}