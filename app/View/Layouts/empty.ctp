<?php
/**
 * Empty layout
 *
 * @copyright (c) 2015-present Bolt Softwares Pvt Ltd
 * @licence GNU Affero General Public License http://www.gnu.org/licenses/agpl-3.0.en.html
 */
?>
<!doctype html>
<html class="passbolt no-js alpha version launching no-passboltplugin <?php echo User::get('Role.name'); ?>" lang="en">
<head>
    <meta charset="utf-8">
<?php echo $this->element('asciiart'); ?>
    <title><?php echo sprintf(Configure::read('App.title'),$this->fetch('title')); ?></title>
    <meta name="description" content="<?php echo Configure::read('punchline'); ?>">
    <meta name="keywords" content="Passbolt, password manager, online password manager, open source password manager">
    <meta name="viewport" content="width=device-width">
</head>
<body>
<!-- main -->
<div id="container" class="page <?php echo $this->fetch('page_classes') ?>">
<?php echo $this->fetch('content'); ?>
</div>
</body>
</html>
