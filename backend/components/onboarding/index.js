const html = require('choo/html');
const { __ } = require('../../locale');

module.exports = function onboarding(content, on) {
  return html`
    <div class="Onboarding">
      <div class="Onboarding-reel">
        <div class="Onboarding-card">
          <div class="Type">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut fringilla lacinia odio, blandit vehicula diam gravida eget. Morbi at imperdiet neque. Pellentesque convallis, nulla vitae mollis maximus, lacus felis iaculis ante, sed congue magna tellus eget elit. Donec id interdum orci. Nulla facilisi. Morbi eu convallis ex. Donec aliquet justo eget leo interdum malesuada. Aliquam id tristique mi, eget convallis lectus. Vestibulum interdum bibendum pretium. Sed a arcu laoreet, pretium ex ut, scelerisque augue. Phasellus scelerisque egestas leo, in pharetra diam tincidunt congue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nam in dictum sapien. Morbi et fermentum neque.</p>
          </div>
        </div>
        <div class="Onboarding-card">
          <div class="Type">
            Hello world
          </div>
        </div>
      </div>
      <ol class="Onboarding-pagination">
        <li><button class="Onboarding-page">Page 1</button></li>
        <li><button class="Onboarding-page">Page 2</button></li>
      </ol>
      <button class="Button u-block u-sizeFull" onclick=${ () => {} }>
        ${ __('Next') }
      </button>
    </div>
  `;
};
