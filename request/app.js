(function({ vDOMInstance }) {
  const songsPerPage = 20
  let cache = []
  let loading = false
  let lastSong = ""

  // stateless components?
  function genSongs(h, { songs, request }) {
    if(songs.length < 1)
      return h('div', { class: "entry-error", key: 5}, "Brak wyników!") 

    let tree = songs.map(song => 
      h('div', { class: 'entry', key: parseInt(Date.now().toString(2)+song.id.toString('2'), 2), "@click": () => request(song) },
        h('div', { class: 'id' }, 
          song.id.toString()
        ),
        h('span', { class: 'title' },
          song.title
        ),
        h('div', null,
          'by ',
          h('span', { class: 'artist' },
            song.artist
          )
        )
      )
    )
    return tree
  }

  function genRequestPopup(h, song, confirm, reject) {
    if(!song) return null

    return h('div', { class: 'popup' },
      h('div',{ class: "p-content" },
        h('p', { class: "bold text--primary" },
          "Potwierdź"
        ),
        h('p', { class: "small" },
          "Czy napewno chcesz zamówić"
        ),
        h('p', { class: "p-title" }, 
          song.name
        ),
        h('div', { class: "p-buttons" },
          h('div', { class: "button error", "@click": () => reject() },
            "Nie"
          ),
          h('div', { class: "button primary", "@click": () => confirm() },
            "Tak"
          )
        )
      )
    )
  }

  function genInfo(h, message, isError, confirm) {
    if(!message) return null

    return h('div', { class: 'popup' },
      h('div',{ class: "p-content" },
        h('p', { class: `bold text--${isError ? 'error' : 'primary'}` },
          isError ? "Error" : "Info"
        ),
        h('p', null,
          message
        ),
        h('div', { class: "p-buttons" },
          h('div', { class: "button primary", "@click": confirm },
            "OK"
          )
        )
      )
    )
  }

  function genSearch(h, search) {
    return h('div', { class: "search" },
      h('div', { class: "search-input" },
        h('input', { 
            ref: "search", 
            placeholder: "Wpisz nazwę piosenki",
            "@keydown": search,
            "@blur": search,
            "@input": search }
        ),
        h('div', { class: "search-button", "@click": search },
          "Search"
        )
      )
    )
  }

  // fetch functions
  function fetchAllSongs() {
    if(cache.length > 0) return cache
    return fetch("https://www.cloudsdalefm.net/api/data/songs")
      .then(res => res.json())
      .then(({ data }) => {
        return data
      })
  }

  class Song {
    constructor(name, id) {
      this.id = id || 0

      const splited = name.split(" - ")
      this.artist = splited.splice(0, 1)[0] || ''
      this.title = splited.join(" - ") || ''
    }

    get name() {
      return `${this.artist} - ${this.title}`
    }

  }

  function range(start, end) {
    return Array.from({length: end-start+1 }, (k, i) => start+i)
  }

  //window.addEventListener("DOMContentLoaded", () => {
    const vdom = new vDOMInstance({
      el: "#requestAPP",
      state: {
        songs: [],
        id: 0,
        request: null,
        message: null,
        errored: false
      },
      computed: {
        page () {
          return Math.floor(this.state.id/songsPerPage)+1
        },
        maxPages () {
          return Math.floor(this.state.songs.length/songsPerPage)
        }
      },
      methods: {
        updateSongs(arrOfStrings) {
          let formated = arrOfStrings.map((str, i) => {
            return new Song(str, i+1)
          })
          console.log(this.tree)
          this.setState({ id: 0, songs: formated })
          return formated
        },
        setRequest(song = null) {
          this.setState({ request: song })
        },
        request() {
          fetch("https://www.cloudsdalefm.net/api/requestsong", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                title: this.state.request.name
            })
          }).then(res => res.json())
          .then(res => {
            if(res.code === 200)
                this.setState({ request: null, message: `Piosenka ${res.data} zamówiona!` })
            else if(res.code === 429)
                this.setState({ request: null, errored: true, message: `Ta piosenka ${res.tryagain ? "była ostatnio zamówiona, poczekaj chwile" : "właśnie leci w radiu!"}` })
            else if(res.code === 413)
                this.setState({ request: null, errored: true, message: `Kolejka jest pełna.` })
            else 
                this.setState({ request: null, errored: true, message: "Piękny i neznany błąd nieoczekiwany" })
            requesting = false
          })
          .catch(err => {
            this.setState({ request: null, errored: true, message: "Piękny i neznany błąd nieoczekiwany: "+err })
          })
        },
        searchSong(evn) {
          if(evn.type === "keydown" && evn.keyCode !== 13) return
          const { search, search: { value } } = this.refs
          if(evn.type !== "input")
            search.blur()
          if(loading || value === lastSong) return;
          loading = true
          lastSong = value
          if(value.length < 1) {
            loading = false
            if(this.state.songs.length !== cache.length)
              this.setState({ songs: cache })
            return;
          }
          fetch(`https://www.cloudsdalefm.net/api/data/searchsong?length=20&title=${value}`)
            .then(res => res.json())
            .then(res => {
              loading = false
              if(res.exists)
                this.methods.updateSongs(res.titles)
              else
                this.setState({ songs: [] })
            })
        },
        mouseScroll(evn) {
          evn.preventDefault()
          let newID = Math.round(this.state.id + (evn.deltaY / 
            (evn.deltaY > 99 || evn.deltaY < -99
            ? 50
            : evn.deltaY > 9 || evn.deltaY < -9
              ? 10
              : 1)
          ))
          if (newID > this.state.songs.length - songsPerPage) {
            newID = this.state.songs.length - songsPerPage
            if (this.state.id === newID) return
          }
          if (newID < 0) {
            newID = 0
            if (this.state.id === newID) return
          }
          this.setState({ id: newID })
        },
        changePageBy(amount) {
          let { page, pages } = this.computed
          page = page + amount - 1
          if(page < 0) page = 0
          if(page >= pages) page = pages - 1
          return this.setState({ id: page * songsPerPage, })
        },
        getPaginationItems(page) {
          let maxLength = 5

          const length = this.computed.maxPages || 1
          if(length <= maxLength) return range(1, length)

          const even = maxLength % 2 === 0 ? 1 : 0;
          const left = 1
          const right = length

          const max = Math.floor(maxLength/2)

          if(page <= left+max)
            return range(left, maxLength)

          else if(page >= right-max)
            return range(right-maxLength+1, right)

          return range(page-max, page+max-even)

        },
        genPaginationEntries(h) {
          let activePage = this.computed.page
          let pages = this.methods.getPaginationItems(activePage)
          let vtree = pages.map((page, i) => {
            return h('div', { 
                class: `page ${activePage === page ? "primary text--white" : ""}`,
                key: page,
                "@click": () =>
                  this.setState({ id: page*songsPerPage-songsPerPage })
              },
              (page).toString()
            )
          })
          return vtree
        },
        genPagination(h) {
          const page = this.computed.page
          const pages = this.computed.maxPages
          return h('div', { class: "pagination", ref: 'pagination' },
            h('div', { 
                key: "<<", class: `action ${page <= 1 ? 'disabled' : ''}`, 
                "@click": () => this.setState({ id: 0 })
              },
              "First"
            ),
            h('div', { 
                key: "<", class: `action ${page <= 1 ? "disabled" : ""}`, 
                "@click": () => this.methods.changePageBy(-1) 
              },
              "<"
            ),
            this.methods.genPaginationEntries(h),
            h('div', { 
                key: ">", class: `action ${page >= pages ? "disabled" : ""}`, 
                "@click": () => this.methods.changePageBy(1) 
              },
              ">"
            ),
            h('div', { 
                key: ">>", class: `action ${page >= pages ? 'disabled' : ''}`, 
                "@click": () => this.setState({ id: this.state.songs.length-songsPerPage }) 
              },
              "Last"
            )
          )
        }
      },
      render(h, state) {
        const songs = state.songs.slice(state.id, state.id+20)
        return h('div', { class: "request" },
          h('div', { class: 'nav' },
            this.methods.genPagination(h),
            genSearch(h, this.methods.searchSong)
          ),
          h('div', { class: "results elevate", "@wheel": "mouseScroll" },
            genSongs(h, { songs, request: this.methods.setRequest })
          ),
          genRequestPopup(h, state.request, this.methods.request, () => this.setState({ request: null })),
          genInfo(h, state.message, state.errored, () => this.setState({ message: null, errored: false }))
        )
      }
    })

    fetchAllSongs().then(songs => {
      cache = vdom.methods.updateSongs(songs)
    })
  //})
})(vDOM)