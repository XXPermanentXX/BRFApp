const html = require('choo/html');

module.exports = function (state, prev, send) {
  return html`
    <footer class="App-footer">
      <div class="App-container">
        <div class="Type">
          <p>BRF Energi is an ongoing research project. For any inquiries or questions, please <a href="mailto:info@brfenergi.com">contact us</a>.</p>
          <p>All source code and content is released under the <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache Licence 2.0</a> and publicly availible on <a href="https://github.com/CIVIS-project/BRFApp">Github</a>.</p>
          <p class="u-textCenter">© 2017 KTH Royal Institute of Technology</p>
        </div>
      </div>
    </footer>
  `;
};
